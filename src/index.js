// index.js
import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import "./preview.js";
import mic from "mic";
import { Server } from "socket.io";
import express from "express";
import http from "http";
import { fileURLToPath } from "url";

// default Socket.IO setup 
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static("public")); // zorgt ervoor dat de controls op de andere client via poort 4000
server.listen(4000, () => console.log("http://localhost:4000"));

// luistert naar de arrows waar op gedrukt worden om deze op het scherm te laten zien
let currentArrow = null;
io.on("connection", (socket) => {
	console.log("Client connected");
	socket.on("arrow", (dir) => {
		console.log("Arrow pressed:", dir);
		currentArrow = dir;
	});
});

// --- DEV MODE CHECK ---
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
registerFont(path.join(__dirname, "../fonts/OpenSans-Variable.ttf"), { family: "OpenSans" });
registerFont(path.join(__dirname, "../fonts/PPNeueMontrealMono-Regular.ttf"), { family: "PPNeueMontreal" });
registerFont(path.join(__dirname, "../fonts/Px437_ACM_VGA.ttf"), { family: "Px437_ACM_VGA" });

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

// const micInputStream = microphone.getAudioStream();
// let currentVolume = 0;

// micInputStream.on("data", (data) => {
// 	const samples = new Int16Array(data.buffer, data.byteOffset, data.length / 2);
// 	let sum = 0;
// 	for (let i = 0; i < samples.length; i++) sum += Math.abs(samples[i]);
// 	currentVolume = sum / samples.length;
// });

// microphone.start();

// --- TICKER SETUP ---
const ticker = new Ticker({ fps: FPS });
let smoothedVolume = 0;
const smoothing = 0.2;

ticker.start(({ deltaTime, elapsedTime }) => {
	console.clear();
	console.time("Write frame");
	console.log(`Rendering a ${width}x${height} canvas`);
	console.log("View at http://localhost:3000/view");

	// // Smooth volume
	// smoothedVolume += (currentVolume - smoothedVolume) * smoothing;
	// console.log(`Mic volume: ${smoothedVolume.toFixed(2)}`);

	// Clear canvas
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, width, height);

	// teken pijl op canvas, gemaakt met chatGPT
	if (currentArrow) {
		ctx.fillStyle = "#fff";
		const cx = width / 2;
		const cy = height / 2;
		const size = Math.min(width, height) / 3;

		ctx.beginPath();
		switch (currentArrow) {
			case "up":
				ctx.moveTo(cx, cy - size);
				ctx.lineTo(cx - size, cy + size);
				ctx.lineTo(cx + size, cy + size);
				break;
			case "down":
				ctx.moveTo(cx, cy + size);
				ctx.lineTo(cx - size, cy - size);
				ctx.lineTo(cx + size, cy - size);
				break;
			case "left":
				ctx.moveTo(cx - size, cy);
				ctx.lineTo(cx + size, cy - size);
				ctx.lineTo(cx + size, cy + size);
				break;
			case "right":
				ctx.moveTo(cx + size, cy);
				ctx.lineTo(cx - size, cy - size);
				ctx.lineTo(cx - size, cy + size);
				break;
		}
		ctx.closePath();
		ctx.fill();
	}

	// --- Convert canvas to binary for flipdot ---
	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;
	for (let i = 0; i < data.length; i += 4) {
		const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
		const binary = brightness > 127 ? 255 : 0;
		data[i] = data[i + 1] = data[i + 2] = binary;
		data[i + 3] = 255;
	}
	ctx.putImageData(imageData, 0, 0);

	// --- Output ---
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
