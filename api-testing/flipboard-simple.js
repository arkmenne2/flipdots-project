/**
 * =============================================================================
 * SIMPLE FLIPBOARD INTEGRATION - REPOSITORY DISPLAY SYSTEM
 * =============================================================================
 * 
 * This script integrates with the gallery to display GitHub repository
 * information on the flipboard when paintings are clicked.
 * 
 * Features:
 * - Creates flipboard displays from repository metadata
 * - Shows repository name, owner, and GitHub info
 * - Generates PNG images for flipboard display
 * - Simple and reliable implementation
 * 
 * Author: Flipboard Project Team
 * Last Updated: 2024
 * =============================================================================
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

// =============================================================================
// FLIPBOARD CONFIGURATION
// =============================================================================

/** Flipboard display dimensions (from test-flipboard-upload settings) */
const FLIPBOARD_WIDTH = 84;  // 3 panels × 28 dots
const FLIPBOARD_HEIGHT = 28; // 2 panels × 14 dots

/** Output directory for processed images */
const OUTPUT_DIR = './flipboard-output';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
    }
}

/**
 * Extract repository information from GitHub URL
 * @param {string} githubUrl - GitHub repository URL
 * @returns {Object} Repository information
 */
function extractRepoInfo(githubUrl) {
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
        return {
            owner: match[1],
            name: match[2],
            fullName: `${match[1]}/${match[2]}`
        };
    }
    return {
        owner: 'unknown',
        name: 'unknown',
        fullName: 'unknown/unknown'
    };
}

/**
 * Create flipboard image from repository information
 * @param {string} repoName - Repository name
 * @param {string} repoUrl - Repository URL
 * @param {string} user - Repository owner
 */
function createRepoFlipboard(repoName, repoUrl, user) {
    console.log(`🎨 Creating flipboard for repository: ${repoName}`);
    
    const canvas = createCanvas(FLIPBOARD_WIDTH, FLIPBOARD_HEIGHT);
    const ctx = canvas.getContext('2d');
    
    // Black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, FLIPBOARD_WIDTH, FLIPBOARD_HEIGHT);
    
    // White text
    ctx.fillStyle = 'white';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    
    // Draw title (truncated to fit)
    const title = repoName.substring(0, 20);
    ctx.fillText(title, FLIPBOARD_WIDTH / 2, 8);
    
    // Draw user info
    const userInfo = `by ${user}`.substring(0, 20);
    ctx.fillText(userInfo, FLIPBOARD_WIDTH / 2, 16);
    
    // Draw URL info
    const urlInfo = 'github.com';
    ctx.fillText(urlInfo, FLIPBOARD_WIDTH / 2, 24);
    
    return canvas;
}

/**
 * Create flipboard image with custom message
 * @param {string} message - Message to display
 * @param {string} title - Title for the display
 */
function createMessageFlipboard(message, title) {
    console.log(`🎨 Creating message flipboard: ${title}`);
    
    const canvas = createCanvas(FLIPBOARD_WIDTH, FLIPBOARD_HEIGHT);
    const ctx = canvas.getContext('2d');
    
    // Black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, FLIPBOARD_WIDTH, FLIPBOARD_HEIGHT);
    
    // White text
    ctx.fillStyle = 'white';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    
    // Draw title
    const titleText = title.substring(0, 20);
    ctx.fillText(titleText, FLIPBOARD_WIDTH / 2, 8);
    
    // Draw message (split into lines if needed)
    const words = message.split(' ');
    let line = '';
    let y = 16;
    
    for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        if (testLine.length > 20 && line) {
            ctx.fillText(line, FLIPBOARD_WIDTH / 2, y);
            line = word;
            y += 8;
            if (y > FLIPBOARD_HEIGHT - 4) break;
        } else {
            line = testLine;
        }
    }
    
    if (line && y <= FLIPBOARD_HEIGHT - 4) {
        ctx.fillText(line, FLIPBOARD_WIDTH / 2, y);
    }
    
    return canvas;
}

// =============================================================================
// MAIN INTEGRATION FUNCTION
// =============================================================================

/**
 * Handle painting click - create flipboard display
 * @param {string} githubUrl - GitHub repository URL
 * @param {string} repoName - Repository name
 */
export async function handlePaintingClick(githubUrl, repoName) {
    console.log(`🎨 Painting clicked: ${repoName} (${githubUrl})`);
    
    try {
        ensureOutputDir();
        
        // Extract repository information
        const repoInfo = extractRepoInfo(githubUrl);
        
        // Create flipboard image
        const canvas = createRepoFlipboard(repoName, githubUrl, repoInfo.owner);
        
        // Save flipboard image
        const timestamp = Date.now();
        const outputPath = path.join(OUTPUT_DIR, `repo-${timestamp}.png`);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`✅ Flipboard image created: ${outputPath}`);
        
        return {
            success: true,
            imagePath: outputPath,
            imageUrl: `file://${path.resolve(outputPath)}`,
            message: `Repository "${repoName}" is now displayed on the flipboard!`,
            repoInfo: repoInfo
        };
        
    } catch (error) {
        console.error(`❌ Error handling painting click: ${error.message}`);
        return {
            success: false,
            message: `Error processing repository: ${error.message}`
        };
    }
}

/**
 * Create a custom flipboard message
 * @param {string} message - Message to display
 * @param {string} title - Title for the display
 */
export async function createCustomFlipboard(message, title = 'Message') {
    console.log(`🎨 Creating custom flipboard: ${title}`);
    
    try {
        ensureOutputDir();
        
        // Create flipboard image
        const canvas = createMessageFlipboard(message, title);
        
        // Save flipboard image
        const timestamp = Date.now();
        const outputPath = path.join(OUTPUT_DIR, `custom-${timestamp}.png`);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`✅ Custom flipboard image created: ${outputPath}`);
        
        return {
            success: true,
            imagePath: outputPath,
            imageUrl: `file://${path.resolve(outputPath)}`,
            message: `Custom message "${title}" is now displayed on the flipboard!`
        };
        
    } catch (error) {
        console.error(`❌ Error creating custom flipboard: ${error.message}`);
        return {
            success: false,
            message: `Error creating custom flipboard: ${error.message}`
        };
    }
}

// =============================================================================
// CONSOLE COMMANDS FOR TESTING
// =============================================================================

/**
 * Test the flipboard integration with a sample repository
 */
export async function testFlipboardIntegration() {
    console.log('🧪 Testing flipboard integration...');
    
    const testRepo = 'https://github.com/octocat/Hello-World';
    const result = await handlePaintingClick(testRepo, 'Hello-World');
    
    console.log('Test result:', result);
    return result;
}

/**
 * Test custom message creation
 */
export async function testCustomMessage() {
    console.log('🧪 Testing custom message...');
    
    const result = await createCustomFlipboard('Welcome to the Flipboard Gallery!', 'Welcome');
    
    console.log('Custom message result:', result);
    return result;
}

// Export for use in gallery.js
export { createRepoFlipboard, createMessageFlipboard, extractRepoInfo };

console.log('🎯 Simple flipboard integration module loaded');
