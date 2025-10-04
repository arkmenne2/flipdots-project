// src/config/app-config.js
import path from 'node:path';

// Development configuration
const devConfig = {
    isDev: process.argv.includes('--dev') || process.env.NODE_ENV === 'development',
    outputDir: path.resolve(import.meta.dirname, '../../output'),
    mockDataDir: path.resolve(import.meta.dirname, '../../mock-data')
};

// Music service configuration
const musicServiceConfig = {
    type: 'mock', // Options: 'mock', 'spotify'
    spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID || '',
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
        redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback'
    }
};

// Animation configuration
const animationConfig = {
    nextBackDuration: 800, // Duration for next/back animations in ms
    playPauseDuration: 1200, // Duration for play/pause animations in ms
    nextBackFrameRate: 20, // Frame rate for next/back animations
    playPauseFrameRate: 15 // Frame rate for play/pause animations
};

// Display configuration
const displayConfig = {
    layout: [
        [3, 2, 1],
        [4, 5, 6],
        [9, 8, 7],
        [10, 11, 12],
    ],
    panelWidth: 28,
    isMirrored: true,
    transport: {
        serial: {
            path: '/dev/ttyACM0',
            baudRate: 57600
        },
        ip: {
            host: '127.0.0.1',
            port: 3000
        }
    }
};

// Export main configuration object
export const APP_CONFIG = {
    dev: devConfig,
    musicService: musicServiceConfig,
    animations: animationConfig,
    display: displayConfig
};
