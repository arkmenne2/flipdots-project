// Animation functions for button-triggered flipdot display effects
import { createCanvas } from 'canvas';

export function createBackAnimation(ctx, width, height) {
    // Create a "rewind" animation - spinning rewind symbol
    const frames = [];
    const frameCount = 12;
    
    for (let i = 0; i < frameCount; i++) {
        const frame = createCanvas(width, height);
        const frameCtx = frame.getContext('2d');
        
        // Black background
        frameCtx.fillStyle = '#000';
        frameCtx.fillRect(0, 0, width, height);
        
        // Center coordinates
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        const radius = Math.min(width, height) / 3;
        
        frameCtx.fillStyle = '#fff';
        
        // Create spinning rewind symbol (two overlapping circles with arrows)
        const angle = (i / frameCount) * Math.PI * 2;
        const offset = Math.sin(angle) * 3;
        
        // Draw rewind symbol - two circles with arrows
        const circle1X = centerX - 8 + offset;
        const circle2X = centerX + 8 - offset;
        
        // Circle 1 (left)
        frameCtx.beginPath();
        frameCtx.arc(circle1X, centerY, 6, 0, Math.PI * 2);
        frameCtx.fill();
        
        // Circle 2 (right) 
        frameCtx.beginPath();
        frameCtx.arc(circle2X, centerY, 6, 0, Math.PI * 2);
        frameCtx.fill();
        
        // Add spinning effect with dots
        for (let j = 0; j < 8; j++) {
            const dotAngle = angle + (j * Math.PI / 4);
            const dotX = centerX + Math.cos(dotAngle) * radius;
            const dotY = centerY + Math.sin(dotAngle) * radius;
            frameCtx.fillRect(dotX - 1, dotY - 1, 2, 2);
        }
        
        frames.push(frame);
    }
    
    return frames;
}

export function createPlayPauseAnimation(ctx, width, height, isPlaying) {
    // Create common play/pause icon animation
    const frames = [];
    const frameCount = 6;
    
    for (let i = 0; i < frameCount; i++) {
        const frame = createCanvas(width, height);
        const frameCtx = frame.getContext('2d');
        
        // Black background
        frameCtx.fillStyle = '#000';
        frameCtx.fillRect(0, 0, width, height);
        
        // Center the icon
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        
        // Simple pulsing effect
        const pulse = Math.sin(i * Math.PI / 3) * 0.2 + 0.8;
        const size = 14 * pulse;
        
        frameCtx.fillStyle = '#fff';
        
        if (isPlaying) {
            // Draw pause icon (two vertical bars) - classic style
            const barWidth = 3;
            const barHeight = Math.floor(size);
            const gap = 4;
            
            frameCtx.fillRect(centerX - gap/2 - barWidth, centerY - barHeight/2, barWidth, barHeight);
            frameCtx.fillRect(centerX + gap/2, centerY - barHeight/2, barWidth, barHeight);
        } else {
            // Draw play icon (triangle) - classic style
            frameCtx.beginPath();
            frameCtx.moveTo(centerX - size/2, centerY - size/2);
            frameCtx.lineTo(centerX + size/2, centerY);
            frameCtx.lineTo(centerX - size/2, centerY + size/2);
            frameCtx.closePath();
            frameCtx.fill();
        }
        
        // Add subtle glow effect
        frameCtx.strokeStyle = '#fff';
        frameCtx.lineWidth = 1;
        frameCtx.globalAlpha = 0.3;
        frameCtx.beginPath();
        frameCtx.arc(centerX, centerY, size + 2, 0, Math.PI * 2);
        frameCtx.stroke();
        frameCtx.globalAlpha = 1;
        
        frames.push(frame);
    }
    
    return frames;
}

export function createForwardAnimation(ctx, width, height) {
    // Create a "fast forward" animation - spinning forward symbol
    const frames = [];
    const frameCount = 12;
    
    for (let i = 0; i < frameCount; i++) {
        const frame = createCanvas(width, height);
        const frameCtx = frame.getContext('2d');
        
        // Black background
        frameCtx.fillStyle = '#000';
        frameCtx.fillRect(0, 0, width, height);
        
        // Center coordinates
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        const radius = Math.min(width, height) / 3;
        
        frameCtx.fillStyle = '#fff';
        
        // Create spinning forward symbol (two overlapping circles with arrows)
        const angle = (i / frameCount) * Math.PI * 2;
        const offset = Math.sin(angle) * 3;
        
        // Draw forward symbol - two circles with arrows
        const circle1X = centerX - 8 - offset;
        const circle2X = centerX + 8 + offset;
        
        // Circle 1 (left)
        frameCtx.beginPath();
        frameCtx.arc(circle1X, centerY, 6, 0, Math.PI * 2);
        frameCtx.fill();
        
        // Circle 2 (right) 
        frameCtx.beginPath();
        frameCtx.arc(circle2X, centerY, 6, 0, Math.PI * 2);
        frameCtx.fill();
        
        // Add spinning effect with dots
        for (let j = 0; j < 8; j++) {
            const dotAngle = angle + (j * Math.PI / 4);
            const dotX = centerX + Math.cos(dotAngle) * radius;
            const dotY = centerY + Math.sin(dotAngle) * radius;
            frameCtx.fillRect(dotX - 1, dotY - 1, 2, 2);
        }
        
        frames.push(frame);
    }
    
    return frames;
}

export function createVolumeAnimation(ctx, width, height, volumeLevel) {
    // Create volume indicator animation
    const frames = [];
    const frameCount = 4;
    
    for (let i = 0; i < frameCount; i++) {
        const frame = createCanvas(width, height);
        const frameCtx = frame.getContext('2d');
        
        // Black background
        frameCtx.fillStyle = '#000';
        frameCtx.fillRect(0, 0, width, height);
        
        // Draw volume bars
        frameCtx.fillStyle = '#fff';
        const barWidth = 2;
        const maxBars = 8;
        const barHeight = Math.floor(height * 0.8);
        const startX = Math.floor(width * 0.2);
        const startY = Math.floor(height * 0.1);
        
        for (let bar = 0; bar < maxBars; bar++) {
            const barLevel = Math.floor((volumeLevel / 100) * maxBars);
            if (bar < barLevel) {
                const x = startX + (bar * 4);
                const currentBarHeight = Math.floor(barHeight * (0.3 + (bar / maxBars) * 0.7));
                frameCtx.fillRect(x, startY + barHeight - currentBarHeight, barWidth, currentBarHeight);
            }
        }
        
        frames.push(frame);
    }
    
    return frames;
}
