import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import "./preview.js";
import mic from "mic";

const IS_DEV = process.argv.includes("--dev");

// --- DISPLAY SETUP ---
const display = new Display({
	layout: LAYOUT,
	panelWidth: 28,
	isMirrored: true,
	transport: !IS_DEV
		? { type: "serial", path: "/dev/ttyACM0", baudRate: 57600 }
		: { type: "ip", host: "127.0.0.1", port: 3000 },
});

const { width, height } = display;

// --- OUTPUT DIRECTORY ---
const outputDir = "./output";
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// --- REGISTER FONTS ---
registerFont(path.resolve(import.meta.dirname, "../fonts/OpenSans-Variable.ttf"), { family: "OpenSans" });
registerFont(path.resolve(import.meta.dirname, "../fonts/PPNeueMontrealMono-Regular.ttf"), { family: "PPNeueMontreal" });
registerFont(path.resolve(import.meta.dirname, "../fonts/Px437_ACM_VGA.ttf"), { family: "Px437_ACM_VGA" });

// --- CANVAS SETUP ---
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
ctx.font = "18px monospace";
ctx.textBaseline = "top";

// --- MIC SETUP ---
const microphone = mic({
	rate: "44100",
	channels: "1",
	debug: false,
	device: null,
});

const micInputStream = microphone.getAudioStream();
let currentVolume = 0;

micInputStream.on("data", (data) => {
	const samples = new Int16Array(data.buffer, data.byteOffset, data.length / 2);
	let sum = 0;
	for (let i = 0; i < samples.length; i++) sum += Math.abs(samples[i]);
	currentVolume = sum / samples.length;
});

microphone.start();



// --- TICKER SETUP ---
const ticker = new Ticker({ fps: FPS });
let smoothedVolume = 0;
const smoothing = 0.2;

// Track last Y position for a smooth line
let lastY = height / 2;

ticker.start(({ deltaTime, elapsedTime }) => {
	console.clear();
	console.time("Write frame");
	console.log(`Rendering a ${width}x${height} canvas`);
	console.log("View at http://localhost:3000/view");

	// Smooth volume to avoid jitter
	smoothedVolume += (currentVolume - smoothedVolume) * smoothing;

	// Print mic volume
	console.log(`Mic volume: ${smoothedVolume.toFixed(2)}`);

	// Clear canvas
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, width, height);

	// Draw audio-reactive line
	const baseY = height / 2; // center line
	const amplitude = Math.min(smoothedVolume / 500, 1) * (height / 2); // cap max height

	ctx.beginPath();
	ctx.strokeStyle = "#fff";

	for (let x = 0; x < width; x++) {
		// Use smoothedVolume to move the line up/down randomly across the canvas width
		const noise = (Math.random() - 0.5) * amplitude; 
		const y = baseY + noise;

		if (x === 0) ctx.moveTo(x, lastY);
		else ctx.lineTo(x, y);

		lastY = y;
	}

	ctx.stroke();

	// Convert canvas to binary for flipdot display
	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;
	for (let i = 0; i < data.length; i += 4) {
		const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
		const binary = brightness > 127 ? 255 : 0;
		data[i] = data[i + 1] = data[i + 2] = binary;
		data[i + 3] = 255;
	}
	ctx.putImageData(imageData, 0, 0);

	// Output
	if (IS_DEV) {
		fs.writeFileSync(path.join(outputDir, "frame.png"), canvas.toBuffer("image/png"));
	} else {
		const imageData = ctx.getImageData(0, 0, display.width, display.height);
		display.setImageData(imageData);
		if (display.isDirty()) display.flush();
	}

	console.log(`Elapsed time: ${(elapsedTime / 1000).toFixed(2)}s`);
	console.log(`Delta time: ${deltaTime.toFixed(2)}ms`);
	console.timeEnd("Write frame");
});
