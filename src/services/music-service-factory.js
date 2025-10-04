// src/services/music-service-factory.js
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage } from 'canvas';
import { floydSteinbergDither } from '../dithering.js';

// Mock track data
const MOCK_TRACKS = [
    {
        track: "Bohemian Rhapsody",
        artist: "Queen",
        album: "A Night at the Opera",
        albumImagePath: "../../mock-data/queen.jpg",
        duration: 12000 // 5:54 in milliseconds
    },
    {
        track: "Billie Jean",
        artist: "Michael Jackson",
        album: "Thriller",
        albumImagePath: "../../mock-data/thriller.jpg",
        duration: 12000 // 4:54 in milliseconds
    },
    {
        track: "Smells Like Teen Spirit",
        artist: "Nirvana",
        album: "Nevermind",
        albumImagePath: "../../mock-data/nirvana.jpg",
        duration: 301000 // 5:01 in milliseconds
    },
    {
        track: "Yesterday",
        artist: "The Beatles",
        album: "Help!",
        albumImagePath: "../../mock-data/nirvana.jpg", // Using existing image as placeholder
        duration: 125000 // 2:05 in milliseconds
    }
];

// Mock player state
let currentTrackIndex = 0;
let startTime = Date.now();
let isPlaying = true;
let pausedProgress = 0; // Track progress when paused
let cachedAlbumArt = new Map();

// Helper function to process album art (resize and dither)
async function processAlbumArt(image, maxWidth, maxHeight, cacheKey) {
    // Calculate dimensions maintaining aspect ratio
    const aspectRatio = image.width / image.height;
    let width = maxWidth;
    let height = Math.floor(width / aspectRatio);
    
    if (height > maxHeight) {
        height = maxHeight;
        width = Math.floor(height * aspectRatio);
    }

    // Create canvas for the album art
    const albumCanvas = createCanvas(width, height);
    const albumCtx = albumCanvas.getContext('2d');
    
    // Draw image
    albumCtx.drawImage(image, 0, 0, width, height);
    
    // Apply dithering
    const imageData = albumCtx.getImageData(0, 0, width, height);
    const ditheredData = floydSteinbergDither(imageData, width, height, 128);
    albumCtx.putImageData(ditheredData, 0, 0);
    
    cachedAlbumArt.set(cacheKey, albumCanvas);
    console.log(`Successfully processed album art: ${width}x${height}, dithered`);
    return albumCanvas;
}

// Default configuration
export const DEFAULT_CONFIG = {
    serviceType: 'mock',
    spotifyConfig: {
        clientId: '',
        clientSecret: '',
        redirectUri: ''
    }
};

// Mock Spotify Service Implementation
class MockSpotifyService {
    getCurrentTrack() {
        const track = MOCK_TRACKS[currentTrackIndex];
        if (!track) return null;

        const now = Date.now();
        let progress;

        if (isPlaying) {
            // Calculate progress based on elapsed time
            const elapsed = now - startTime;
            progress = pausedProgress + elapsed;
        } else {
            // Use paused progress
            progress = pausedProgress;
        }

        // Loop back to start if track finished
        if (progress >= track.duration) {
            progress = 0;
            startTime = now;
            pausedProgress = 0;
        }

        return {
            track: track.track,
            artist: track.artist,
            album: track.album,
            duration: track.duration,
            progress: progress,
            isPlaying: isPlaying
        };
    }

    async getAlbumArt(trackData, maxWidth, maxHeight) {
        const track = MOCK_TRACKS.find(t => t.track === trackData.track);
        if (!track) return null;

        const cacheKey = `${track.albumImagePath}-${maxWidth}-${maxHeight}`;
        
        if (cachedAlbumArt.has(cacheKey)) {
            return cachedAlbumArt.get(cacheKey);
        }

        try {
            const imagePath = path.resolve(import.meta.dirname, track.albumImagePath);
            
            if (!fs.existsSync(imagePath)) {
                console.warn(`Album art not found: ${imagePath}`);
                return null;
            }

            const image = await loadImage(imagePath);
            console.log(`Loading album art: ${track.track} (${image.width}x${image.height})`);
            return await processAlbumArt(image, maxWidth, maxHeight, cacheKey);
            
        } catch (error) {
            console.error('Error loading album art:', error);
            return null;
        }
    }

    nextTrack() {
        currentTrackIndex = (currentTrackIndex + 1) % MOCK_TRACKS.length;
        startTime = Date.now();
        pausedProgress = 0;
        console.log(`Switched to track ${currentTrackIndex + 1}: ${MOCK_TRACKS[currentTrackIndex].track}`);
    }

    previousTrack() {
        currentTrackIndex = currentTrackIndex === 0 ? MOCK_TRACKS.length - 1 : currentTrackIndex - 1;
        startTime = Date.now();
        pausedProgress = 0;
        console.log(`Switched to track ${currentTrackIndex + 1}: ${MOCK_TRACKS[currentTrackIndex].track}`);
    }

    togglePlayback() {
        const now = Date.now();
        
        if (isPlaying) {
            // Pause
            pausedProgress += now - startTime;
            isPlaying = false;
            console.log('Paused playback');
        } else {
            // Resume
            startTime = now;
            isPlaying = true;
            console.log('Resumed playback');
        }
    }

    play() {
        if (!isPlaying) {
            startTime = Date.now();
            isPlaying = true;
            console.log('Started playback');
        }
    }

    pause() {
        if (isPlaying) {
            pausedProgress += Date.now() - startTime;
            isPlaying = false;
            console.log('Paused playback');
        }
    }
}

// Real Spotify Service Implementation (placeholder)
class SpotifyService {
    constructor(config) {
        this.config = config;
        console.log('Spotify service initialized with config:', config);
    }

    getCurrentTrack() {
        // TODO: Implement real Spotify API integration
        console.log('Spotify service getCurrentTrack - not implemented yet');
        return null;
    }

    async getAlbumArt(trackData, maxWidth, maxHeight) {
        // TODO: Implement real Spotify album art fetching
        console.log('Spotify service getAlbumArt - not implemented yet');
        return null;
    }

    nextTrack() {
        // TODO: Implement real Spotify next track
        console.log('Spotify service nextTrack - not implemented yet');
    }

    previousTrack() {
        // TODO: Implement real Spotify previous track
        console.log('Spotify service previousTrack - not implemented yet');
    }

    togglePlayback() {
        // TODO: Implement real Spotify play/pause toggle
        console.log('Spotify service togglePlayback - not implemented yet');
    }

    play() {
        // TODO: Implement real Spotify play
        console.log('Spotify service play - not implemented yet');
    }

    pause() {
        // TODO: Implement real Spotify pause
        console.log('Spotify service pause - not implemented yet');
    }
}

// Factory class
export class MusicServiceFactory {
    static createService(config = DEFAULT_CONFIG) {
        switch (config.serviceType) {
            case 'spotify':
                return new SpotifyService(config.spotifyConfig);
            case 'mock':
            default:
                return new MockSpotifyService();
        }
    }
}
