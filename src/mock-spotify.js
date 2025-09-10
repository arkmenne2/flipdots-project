// src/mock-spotify.js
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage } from 'canvas';
import { floydSteinbergDither } from './dithering.js';

// Mock track data
const MOCK_TRACKS = [
    {
        track: "Bohemian Rhapsody",
        artist: "Queen",
        album: "A Night at the Opera",
        albumImagePath: "../mock-data/queen.jpg",
        duration: 12000 // 5:54 in milliseconds
    },
    {
        track: "Billie Jean",
        artist: "Michael Jackson",
        album: "Thriller",
        albumImagePath: "../mock-data/thriller.jpg",
        duration: 12000 // 4:54 in milliseconds
    },
    {
        track: "Smells Like Teen Spirit",
        artist: "Nirvana",
        album: "Nevermind",
        albumImagePath: "../mock-data/nirvana.jpg",
        duration: 301000 // 5:01 in milliseconds
    },
    {
        track: "Yesterday",
        artist: "The Beatles",
        album: "Help!",
        albumImagePath: "../mock-data/nirvana.jpg", // Using existing image as placeholder
        duration: 125000 // 2:05 in milliseconds
    }
];

// Mock player
let currentTrackIndex = 0;
let startTime = Date.now();
let isPlaying = true;
let pausedProgress = 0; // Track progress when paused
let cachedAlbumArt = new Map();

// Get current track data
export function getCurrentTrack() {
    const track = MOCK_TRACKS[currentTrackIndex];
    
    if (!isPlaying) {
        return {
            isPlaying: false,
            track: track.track,
            artist: track.artist,
            album: track.album,
            albumImagePath: track.albumImagePath,
            progress: pausedProgress,
            duration: track.duration
        };
    }

    const elapsed = Date.now() - startTime;

    // Check if track finished
    if (elapsed >= track.duration) {
        // Move to next track
        currentTrackIndex = (currentTrackIndex + 1) % MOCK_TRACKS.length;
        startTime = Date.now();
        pausedProgress = 0;
        return getCurrentTrack();
    }

    return {
        isPlaying: true,
        track: track.track,
        artist: track.artist,
        album: track.album,
        albumImagePath: track.albumImagePath,
        progress: elapsed,
        duration: track.duration
    };
}

// Enhanced contrast function for better low-res display
function enhanceContrast(imageData, factor) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < 3; j++) {
            let v = data[i + j];
            v = ((v - 128) * factor) + 128;
            data[i + j] = Math.max(0, Math.min(255, v));
        }
    }
    return imageData;
}

// Process album art with enhanced dithering for better low-res results
export async function getAlbumArt(trackData, targetWidth, targetHeight) {
    if (!trackData || !trackData.albumImagePath) return null;

    // Check cache first
    if (cachedAlbumArt.has(trackData.albumImagePath)) {
        return cachedAlbumArt.get(trackData.albumImagePath);
    }

    try {
        // Load image
        const imagePath = path.resolve(import.meta.dirname, trackData.albumImagePath);
        if (!fs.existsSync(imagePath)) {
            console.error(`Album art not found: ${imagePath}`);
            return null;
        }

        const img = await loadImage(imagePath);
        
        // Process at higher resolution then downscale for better quality
        const processingCanvas = createCanvas(targetWidth * 2, targetHeight * 2);
        const processingCtx = processingCanvas.getContext('2d');
        processingCtx.drawImage(img, 0, 0, targetWidth * 2, targetHeight * 2);

        // Enhance contrast for better low-res display
        let imageData = processingCtx.getImageData(0, 0, targetWidth * 2, targetHeight * 2);
        imageData = enhanceContrast(imageData, 1.3);
        processingCtx.putImageData(imageData, 0, 0);

        // Downscale to target size
        const finalCanvas = createCanvas(targetWidth, targetHeight);
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.drawImage(processingCanvas, 0, 0, targetWidth, targetHeight);

        // Apply Floyd-Steinberg dithering for better low-res results
        let finalImageData = finalCtx.getImageData(0, 0, targetWidth, targetHeight);
        finalImageData = floydSteinbergDither(finalImageData, targetWidth, targetHeight, 128);
        finalCtx.putImageData(finalImageData, 0, 0);

        // Cache the result
        cachedAlbumArt.set(trackData.albumImagePath, finalCanvas);

        return finalCanvas;
    } catch (error) {
        console.error('Error processing album art:', error);
        return null;
    }
}

// Toggle play/pause
export function togglePlayback() {
    isPlaying = !isPlaying;
    if (isPlaying) {
        startTime = Date.now() - pausedProgress;
    } else {
        // When pausing, save the current progress
        const elapsed = Date.now() - startTime;
        pausedProgress = elapsed;
    }
    return isPlaying;
}

// Skip to next track
export function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % MOCK_TRACKS.length;
    startTime = Date.now();
    pausedProgress = 0;
    return getCurrentTrack();
}