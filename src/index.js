import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import { setButtonHandler } from "./preview.js";
import { getCurrentTrack, getAlbumArt, togglePlayback, nextTrack } from "./mock-spotify.js";
import { floydSteinbergDither } from "./dithering.js";
import { createBackAnimation, createPlayPauseAnimation, createForwardAnimation } from "./animations.js";


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

// Create mock-data directory if it doesn't exist
const mockDataDir = "./mock-data";
if (!fs.existsSync(mockDataDir)) {
	fs.mkdirSync(mockDataDir, { recursive: true });
	console.log(`Created ${mockDataDir} directory. Please add sample album art images there.`);
}

// Register fonts

registerFont(path.resolve(import.meta.dirname, "../fonts/cg-pixel-4x5.ttf"), {
	family: "cg-pixel-4x5",
});

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
ctx.imageSmoothingEnabled = false;
ctx.textBaseline = "top";

// Track state
let currentTrackData = null;
let albumArtCanvas = null;

// Animation state
let currentAnimation = null;
let animationFrames = [];
let animationFrameIndex = 0;
let animationPlaying = false;
let animationStartTime = 0;

// Helper: word wrap and draw text
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
	// Handle undefined or null text
	if (!text || typeof text !== 'string') {
		return y;
	}
	
	const words = text.split(' ');
	let line = '';
	let linesUsed = 0;
	for (let i = 0; i < words.length; i++) {
		const testLine = line + words[i] + ' ';
		const metrics = ctx.measureText(testLine);
		if (metrics.width > maxWidth && i > 0) {
			ctx.fillText(line, x, y);
			line = words[i] + ' ';
			y += lineHeight;
			linesUsed++;
			if (linesUsed >= maxLines - 1) {
				line = line.substring(0, line.length - 1) + '...';
				break;
			}
		} else {
			line = testLine;
		}
	}
	ctx.fillText(line, x, y);
	linesUsed++;
	return y + lineHeight;
}

// Function to update track data
async function updateTrackData() {
	try {
		const newTrackData = getCurrentTrack();

		// If we have new track data and it's different from current one
		if (newTrackData &&
			(!currentTrackData ||
				newTrackData.track !== currentTrackData.track)) {

			// Get album art with Atkinson dithering for better low-res
			albumArtCanvas = await getAlbumArt(
				newTrackData,
				42,  // Use half display width or 28px max
				height
			);
		}

		currentTrackData = newTrackData;
	} catch (error) {
		console.error('Failed to update track data:', error);
	}
}

// Function to trigger button animations
function triggerAnimation(type) {
	animationPlaying = true;
	animationStartTime = Date.now();
	animationFrameIndex = 0;
	
	switch(type) {
		case 'back':
			animationFrames = createBackAnimation(ctx, width, height);
			currentAnimation = 'back';
			break;
		case 'playpause':
			animationFrames = createPlayPauseAnimation(ctx, width, height, currentTrackData?.isPlaying || false);
			currentAnimation = 'playpause';
			break;
		case 'forward':
			animationFrames = createForwardAnimation(ctx, width, height);
			currentAnimation = 'forward';
			break;
	}
	
	// Animation duration (in milliseconds)
	const animationDuration = 1000;
	
	// Stop animation after duration
	setTimeout(() => {
		animationPlaying = false;
		currentAnimation = null;
		animationFrames = [];
	}, animationDuration);
}

// Function to handle button actions
function handleButtonAction(action) {
	switch(action) {
		case 'back':
			// Go to previous track
			console.log('Back button pressed');
			triggerAnimation('back');
			break;
		case 'playpause':
			// Toggle play/pause
			console.log('Play/Pause button pressed');
			togglePlayback();
			triggerAnimation('playpause');
			break;
		case 'forward':
			// Go to next track
			console.log('Forward button pressed');
			nextTrack();
			triggerAnimation('forward');
			break;
	}
}

// Initialize the ticker
const ticker = new Ticker({ fps: FPS });

// Update track data initially
await updateTrackData();

ticker.start(async ({ deltaTime, elapsedTime }) => {
	// Update track data every frame to get current progress
	await updateTrackData();

	console.clear();
	console.time("Write frame");
	console.log(`Rendering a ${width}x${height} canvas`);
	console.log("View at http://localhost:3000/");

	ctx.clearRect(0, 0, width, height);

	// Fill the canvas with a black background
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, width, height);

	// Check if we're playing a button animation
	if (animationPlaying && animationFrames.length > 0) {
		// Play animation frames
		const frameRate = 8; // 8 FPS for animations
		const frameTime = 1000 / frameRate;
		const elapsed = Date.now() - animationStartTime;
		animationFrameIndex = Math.floor(elapsed / frameTime) % animationFrames.length;
		
		if (animationFrameIndex < animationFrames.length) {
			ctx.drawImage(animationFrames[animationFrameIndex], 0, 0);
		}
	} else if (currentTrackData && currentTrackData.isPlaying) {
		// Album art on left side - increase the size to 42x28
		const albumSize = Math.min(42, height);
		if (albumArtCanvas) {
			ctx.drawImage(albumArtCanvas, 0, 0, albumSize, height);
		}
		const margin = 5; // 5px margin between album art and text
		const albumWidth = albumSize;
		const textX = albumWidth + margin;
		const textAreaWidth = width - textX - 2; // 2px right margin
		let textY = 2;
		ctx.fillStyle = "#fff";
		ctx.font = '5px "cg-pixel-4x5"';
		// Song name
		if (currentTrackData.track) {
			textY = drawWrappedText(ctx, currentTrackData.track, textX, textY, textAreaWidth, 6, 2);
			textY += 2; // Smaller margin between song name and artist
		}
		// Artist name
		if (currentTrackData.artist) {
			ctx.font = '5px "cg-pixel-4x5"';
			textY = drawWrappedText(ctx, currentTrackData.artist, textX, textY, textAreaWidth, 6, 2);
		}
		// Progress bar - 1 pixel height, clean styling
		const barHeight = 1; // Single pixel bar
		const barWidth = textAreaWidth;
		const progress = currentTrackData.duration > 0 ? currentTrackData.progress / currentTrackData.duration : 0;
		const progressY = height - barHeight - 1; // 1px above bottom
		ctx.fillStyle = "#333";
		ctx.fillRect(textX, progressY, barWidth, barHeight);
		ctx.fillStyle = "#fff";
		ctx.fillRect(textX, progressY, barWidth * progress, barHeight);
	} else {
		// Not playing message - only show if no track data at all
		if (!currentTrackData) {
			ctx.fillStyle = "#fff";
			ctx.font = '6px "cg-pixel-4x5"';
			const noMusicMsg = "No music playing";
			const textMetrics = ctx.measureText(noMusicMsg);
			const textX = (width - textMetrics.width) / 2;
			const textY = height / 2;
			ctx.fillText(noMusicMsg, textX, textY);
		} else {
			// Show paused track info
			const albumSize = Math.min(42, height);
			if (albumArtCanvas) {
				ctx.drawImage(albumArtCanvas, 0, 0, albumSize, height);
			}
			const margin = 5;
			const albumWidth = albumSize;
			const textX = albumWidth + margin;
			const textAreaWidth = width - textX - 2;
			let textY = 2;
			ctx.fillStyle = "#fff";
			ctx.font = '5px "cg-pixel-4x5"';
			// Song name
			if (currentTrackData.track) {
				textY = drawWrappedText(ctx, currentTrackData.track, textX, textY, textAreaWidth, 6, 2);
				textY += 2;
			}
			// Artist name
			if (currentTrackData.artist) {
				ctx.font = '5px "cg-pixel-4x5"';
				textY = drawWrappedText(ctx, currentTrackData.artist, textX, textY, textAreaWidth, 6, 2);
			}
			// Paused indicator
			ctx.fillStyle = "#666";
			ctx.font = '4px "cg-pixel-4x5"';
			ctx.fillText("PAUSED", textX, height - 8);
		}
	}

	// --- DITHERING STEP ---
	// Use Floyd-Steinberg dithering for better low-res results
	const imageData = ctx.getImageData(0, 0, width, height);
	const ditheredData = floydSteinbergDither(imageData, width, height, 128);
	ctx.putImageData(ditheredData, 0, 0);

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

	console.log(`Elapsed time: ${(elapsedTime / 1000).toFixed(2)}s`);
	console.log(`Delta time: ${deltaTime.toFixed(2)}ms`);
	console.timeEnd("Write frame");
});

// Connect button handler to the preview server
setButtonHandler(handleButtonAction);