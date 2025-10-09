/**
 * =============================================================================
 * SIMPLE FLIPBOARD TEST - DIRECT REPOSITORY PROCESSING
 * =============================================================================
 * 
 * This script tests the flipboard integration with a simpler approach
 * that doesn't require downloading and extracting repositories.
 * =============================================================================
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

// =============================================================================
// FLIPBOARD CONFIGURATION
// =============================================================================

const FLIPBOARD_WIDTH = 84;
const FLIPBOARD_HEIGHT = 28;
const OUTPUT_DIR = './flipboard-output';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function ensureOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
    }
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
 * Process repository for flipboard display (simplified version)
 * @param {string} githubUrl - GitHub repository URL
 * @param {string} repoName - Repository name
 */
async function processRepoForFlipboard(githubUrl, repoName) {
    console.log(`🚀 Processing repository for flipboard: ${repoName}`);
    
    ensureOutputDir();
    
    try {
        // Extract user from URL
        const urlMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        const user = urlMatch ? urlMatch[1] : 'unknown';
        
        // Create flipboard image
        const canvas = createRepoFlipboard(repoName, githubUrl, user);
        
        // Save flipboard image
        const timestamp = Date.now();
        const outputPath = path.join(OUTPUT_DIR, `repo-${timestamp}.png`);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`✅ Flipboard image created: ${outputPath}`);
        
        return {
            success: true,
            imagePath: outputPath,
            message: `Repository "${repoName}" is now displayed on the flipboard!`
        };
        
    } catch (error) {
        console.error(`❌ Error processing repository: ${error.message}`);
        return {
            success: false,
            message: `Error processing repository: ${error.message}`
        };
    }
}

// =============================================================================
// TEST FUNCTION
// =============================================================================

async function testSimpleFlipboard() {
    console.log('🧪 Testing simple flipboard integration...');
    
    const testRepo = 'https://github.com/octocat/Hello-World';
    const testRepoName = 'Hello-World';
    
    console.log(`📥 Testing with repository: ${testRepo}`);
    
    try {
        const result = await processRepoForFlipboard(testRepo, testRepoName);
        
        if (result.success) {
            console.log('✅ Test successful!');
            console.log(`📁 Flipboard image created: ${result.imagePath}`);
            console.log(`💬 Message: ${result.message}`);
        } else {
            console.log('❌ Test failed!');
            console.log(`💬 Error: ${result.message}`);
        }
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
    
    console.log('🏁 Test completed');
}

// Run the test
testSimpleFlipboard();
