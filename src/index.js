import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import "./preview.js";

const IS_DEV = process.argv.includes("--dev");

// Create display
const display = new Display({
	layout: LAYOUT,
	panelWidth: 28,
	isMirrored: true,
	transport: !IS_DEV ? {
		type: 'serial',
		path: '/dev/ttyACM0',
		baudRate: 57600
	} : {
		type: 'ip',
		host: '127.0.0.1',
		port: 3000
	}
});

const { width, height } = display;

// Create output directory if it doesn't exist
const outputDir = "./output";
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

// Register fonts
registerFont(
	path.resolve(import.meta.dirname, "../fonts/OpenSans-Variable.ttf"),
	{ family: "OpenSans" },
);
registerFont(
	path.resolve(import.meta.dirname, "../fonts/PPNeueMontrealMono-Regular.ttf"),
	{ family: "PPNeueMontreal" },
);
registerFont(path.resolve(import.meta.dirname, "../fonts/Px437_ACM_VGA.ttf"), {
	family: "Px437_ACM_VGA",
});

// Create canvas with the specified resolution
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");

// Disable anti-aliasing and image smoothing
ctx.imageSmoothingEnabled = false;
// Set a pixel-perfect monospace font
ctx.font = "18px monospace";
// Align text precisely to pixel boundaries
ctx.textBaseline = "top";

// Initialize the ticker at x frames per second
const ticker = new Ticker({ fps: FPS });

ticker.start(({ deltaTime, elapsedTime }) => {
	// Clear the console
	console.clear();
	console.time("Write frame");
	console.log(`Rendering a ${width}x${height} canvas`);
	console.log("View at http://localhost:3000/view");

	ctx.clearRect(0, 0, width, height);

	// Fill the canvas with a black background
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, width, height);

	// Draw analog (left) and digital (right) clocks side-by-side
	{
		const now = new Date();

		// Digital string and metrics first
		const minutesRaw = now.getMinutes();
		const hh = String(now.getHours()).padStart(2, "0");
		const mm = String(minutesRaw).padStart(2, "0");
		const digital = `${hh}:${mm}`;
		ctx.fillStyle = "#fff";
		ctx.font = '14px "Px437_ACM_VGA"';
		const m = ctx.measureText(digital);
		const textWidth = m.width;
		const textHeight = (m.actualBoundingBoxAscent ?? 0) + (m.actualBoundingBoxDescent ?? 0);

		// Layout: analog left, digital right, small gap
		const centerY = Math.floor(height / 2);
		const margin = 3;
		const gap = 3;
		const availableWidthForAnalog = Math.max(0, width - textWidth - gap - margin * 2);
		const radius = Math.max(4, Math.min(Math.floor(availableWidthForAnalog / 2), Math.floor(height / 2) - margin));
		const centerX = margin + radius; // left aligned analog

		// Clock face 
		ctx.strokeStyle = "#fff";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
		ctx.stroke();

		// Hour markers (12)
		for (let i = 0; i < 12; i++) {
			const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
			const inner = radius - 4;
			const outer = radius;
			const x1 = centerX + Math.cos(angle) * inner;
			const y1 = centerY + Math.sin(angle) * inner;
			const x2 = centerX + Math.cos(angle) * outer;
			const y2 = centerY + Math.sin(angle) * outer;
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		}

		// Calculate angles (hours and minutes only)
		const minutes = minutesRaw;
		const hours = (now.getHours() % 12) + minutes / 60;
		const minAngle = (minutes / 60) * Math.PI * 2 - Math.PI / 2;
		const hourAngle = (hours / 12) * Math.PI * 2 - Math.PI / 2;

		// Hour hand
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(centerX, centerY);
		ctx.lineTo(
			centerX + Math.cos(hourAngle) * (radius * 0.5),
			centerY + Math.sin(hourAngle) * (radius * 0.5),
		);
		ctx.stroke();

		// Minute hand
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(centerX, centerY);
		ctx.lineTo(
			centerX + Math.cos(minAngle) * (radius * 0.75),
			centerY + Math.sin(minAngle) * (radius * 0.75),
		);
		ctx.stroke();

		// Center dot
		ctx.fillStyle = "#fff";
		ctx.beginPath();
		ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
		ctx.fill();

		// Digital immediately to the right of analog, vertically centered
		const textX = centerX + radius + gap;
		const prevBaseline = ctx.textBaseline;
		ctx.textBaseline = "middle";
		const textY = centerY;
		ctx.fillText(digital, textX, textY);
		ctx.textBaseline = prevBaseline;
	}

	// Convert image to binary (purely black and white) for flipdot display
	{
		const imageData = ctx.getImageData(0, 0, width, height);
		const data = imageData.data;
		for (let i = 0; i < data.length; i += 4) {
			// Apply thresholding - any pixel above 127 brightness becomes white (255), otherwise black (0)
			const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
			const binary = brightness > 127 ? 255 : 0;
			data[i] = binary; // R
			data[i + 1] = binary; // G
			data[i + 2] = binary; // B
			data[i + 3] = 255; // The board is not transparent :-)
		}
		ctx.putImageData(imageData, 0, 0);
	}

	if (IS_DEV) {
		// Save the canvas as a PNG file
		const filename = path.join(outputDir, "frame.png");
		const buffer = canvas.toBuffer("image/png");
		fs.writeFileSync(filename, buffer);
	} else {
		const imageData = ctx.getImageData(0, 0, display.width, display.height);
		display.setImageData(imageData);
		if (display.isDirty()) {
			display.flush();
		}
	}

	console.log(`Eslapsed time: ${(elapsedTime / 1000).toFixed(2)}s`);
	console.log(`Delta time: ${deltaTime.toFixed(2)}ms`);
	console.timeEnd("Write frame");
});
