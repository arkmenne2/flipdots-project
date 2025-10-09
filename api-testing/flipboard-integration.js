/**
 * =============================================================================
 * FLIPBOARD INTEGRATION - REPOSITORY DISPLAY SYSTEM
 * =============================================================================
 * 
 * This script integrates the test-flipboard-upload system with the gallery
 * to display GitHub repositories on the physical flipboard when paintings are clicked.
 * 
 * Features:
 * - Downloads GitHub repositories when paintings are clicked
 * - Processes repository content for flipboard display
 * - Shows repository info on the physical flipboard
 * - Handles different repository types (HTML, images, text files)
 * 
 * Author: Flipboard Project Team
 * Last Updated: 2024
 * =============================================================================
 */

import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
 * Download a file from URL
 * @param {string} url - URL to download from
 * @param {string} filepath - Local file path to save to
 */
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {}); // Delete the file on error
            reject(err);
        });
    });
}

/**
 * Download GitHub repository as ZIP
 * @param {string} githubUrl - GitHub repository URL
 * @param {string} outputPath - Path to save the ZIP file
 */
async function downloadRepo(githubUrl, outputPath) {
    console.log(`📥 Downloading repository: ${githubUrl}`);
    
    // Convert GitHub URL to ZIP download URL
    const zipUrl = githubUrl.replace('github.com', 'github.com').replace('/tree/', '/') + '/archive/refs/heads/main.zip';
    
    try {
        await downloadFile(zipUrl, outputPath);
        console.log(`✅ Repository downloaded: ${outputPath}`);
        return true;
    } catch (error) {
        console.log(`❌ Failed to download repository: ${error.message}`);
        return false;
    }
}

/**
 * Extract ZIP file
 * @param {string} zipPath - Path to ZIP file
 * @param {string} extractPath - Path to extract to
 */
async function extractZip(zipPath, extractPath) {
    try {
        // Use PowerShell to extract ZIP (Windows)
        const command = `powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractPath}' -Force"`;
        await execAsync(command);
        console.log(`📦 Extracted repository to: ${extractPath}`);
        
        // Check if extraction was successful
        if (fs.existsSync(extractPath)) {
            const files = fs.readdirSync(extractPath);
            console.log(`📁 Extracted files: ${files.join(', ')}`);
            return true;
        } else {
            console.log(`❌ Extraction directory not found: ${extractPath}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Failed to extract ZIP: ${error.message}`);
        return false;
    }
}

/**
 * Find main file in repository (index.html, README.md, etc.)
 * @param {string} repoPath - Path to extracted repository
 */
function findMainFile(repoPath) {
    console.log(`🔍 Searching for main file in: ${repoPath}`);
    
    const mainFiles = [
        'index.html',
        'README.md',
        'main.html',
        'app.html',
        'game.html',
        'demo.html'
    ];
    
    // First, check if repoPath contains a subdirectory (common with GitHub downloads)
    let searchPath = repoPath;
    const files = fs.readdirSync(repoPath);
    console.log(`📁 Directory contents: ${files.join(', ')}`);
    
    // Look for a subdirectory that might contain the actual repo
    const subdir = files.find(file => {
        const fullPath = path.join(repoPath, file);
        return fs.statSync(fullPath).isDirectory() && !file.startsWith('.');
    });
    
    if (subdir) {
        searchPath = path.join(repoPath, subdir);
        console.log(`📁 Found subdirectory: ${subdir}, searching in: ${searchPath}`);
    }
    
    // Search for main files
    for (const file of mainFiles) {
        const filePath = path.join(searchPath, file);
        if (fs.existsSync(filePath)) {
            console.log(`📄 Found main file: ${file}`);
            return filePath;
        }
    }
    
    // Look for any HTML file
    const searchFiles = fs.readdirSync(searchPath);
    const htmlFile = searchFiles.find(file => file.endsWith('.html'));
    if (htmlFile) {
        console.log(`📄 Found HTML file: ${htmlFile}`);
        return path.join(searchPath, htmlFile);
    }
    
    // Look for any markdown file
    const mdFile = searchFiles.find(file => file.endsWith('.md'));
    if (mdFile) {
        console.log(`📄 Found markdown file: ${mdFile}`);
        return path.join(searchPath, mdFile);
    }
    
    // Look for any text file
    const txtFile = searchFiles.find(file => file.endsWith('.txt'));
    if (txtFile) {
        console.log(`📄 Found text file: ${txtFile}`);
        return path.join(searchPath, txtFile);
    }
    
    console.log(`❌ No main file found in repository`);
    return null;
}

/**
 * Create flipboard image from text content
 * @param {string} text - Text content to display
 * @param {string} title - Title for the display
 */
function createTextFlipboard(text, title) {
    console.log(`🎨 Creating text flipboard for: ${title}`);
    
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
    ctx.fillText(title.substring(0, 20), FLIPBOARD_WIDTH / 2, 8);
    
    // Draw text content (truncated to fit)
    const lines = text.substring(0, 200).split('\n').slice(0, 3);
    lines.forEach((line, index) => {
        ctx.fillText(line.substring(0, 20), FLIPBOARD_WIDTH / 2, 16 + (index * 8));
    });
    
    return canvas;
}

/**
 * Create flipboard image from HTML content
 * @param {string} htmlContent - HTML content
 * @param {string} title - Title for the display
 */
function createHtmlFlipboard(htmlContent, title) {
    console.log(`🎨 Creating HTML flipboard for: ${title}`);
    
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
    ctx.fillText(title.substring(0, 20), FLIPBOARD_WIDTH / 2, 8);
    
    // Extract text from HTML (simple approach)
    const textContent = htmlContent.replace(/<[^>]*>/g, '').substring(0, 100);
    const lines = textContent.split('\n').slice(0, 3);
    
    lines.forEach((line, index) => {
        ctx.fillText(line.substring(0, 20), FLIPBOARD_WIDTH / 2, 16 + (index * 8));
    });
    
    return canvas;
}

/**
 * Process repository and create flipboard display
 * @param {string} githubUrl - GitHub repository URL
 * @param {string} repoName - Repository name
 */
async function processRepoForFlipboard(githubUrl, repoName) {
    console.log(`🚀 Processing repository for flipboard: ${repoName}`);
    
    ensureOutputDir();
    
    const timestamp = Date.now();
    const zipPath = path.join(OUTPUT_DIR, `${repoName}-${timestamp}.zip`);
    const extractPath = path.join(OUTPUT_DIR, `${repoName}-${timestamp}`);
    
    try {
        // Download repository
        const downloaded = await downloadRepo(githubUrl, zipPath);
        if (!downloaded) {
            throw new Error('Failed to download repository');
        }
        
        // Extract repository
        const extracted = await extractZip(zipPath, extractPath);
        if (!extracted) {
            throw new Error('Failed to extract repository');
        }
        
        // Find main file
        const mainFile = findMainFile(extractPath);
        if (!mainFile) {
            throw new Error('No main file found in repository');
        }
        
        // Read file content
        const content = fs.readFileSync(mainFile, 'utf8');
        const extension = path.extname(mainFile);
        
        let canvas;
        
        // Create flipboard based on file type
        if (extension === '.html') {
            canvas = createHtmlFlipboard(content, repoName);
        } else {
            canvas = createTextFlipboard(content, repoName);
        }
        
        // Save flipboard image
        const outputPath = path.join(OUTPUT_DIR, `repo-${timestamp}.png`);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`✅ Flipboard image created: ${outputPath}`);
        
        // Clean up temporary files
        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });
        
        return outputPath;
        
    } catch (error) {
        console.error(`❌ Error processing repository: ${error.message}`);
        
        // Clean up on error
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        if (fs.existsSync(extractPath)) fs.rmSync(extractPath, { recursive: true, force: true });
        
        return null;
    }
}

// =============================================================================
// MAIN INTEGRATION FUNCTION
// =============================================================================

/**
 * Handle painting click - download repo and show on flipboard
 * @param {string} githubUrl - GitHub repository URL
 * @param {string} repoName - Repository name
 */
export async function handlePaintingClick(githubUrl, repoName) {
    console.log(`🎨 Painting clicked: ${repoName} (${githubUrl})`);
    
    try {
        const flipboardImage = await processRepoForFlipboard(githubUrl, repoName);
        
        if (flipboardImage) {
            console.log(`🎯 Repository displayed on flipboard: ${flipboardImage}`);
            
            // Open the flipboard image in browser for preview
            const imageUrl = `file://${path.resolve(flipboardImage)}`;
            console.log(`🖼️ Flipboard preview: ${imageUrl}`);
            
            return {
                success: true,
                imagePath: flipboardImage,
                imageUrl: imageUrl,
                message: `Repository "${repoName}" is now displayed on the flipboard!`
            };
        } else {
            return {
                success: false,
                message: `Failed to process repository "${repoName}" for flipboard display`
            };
        }
        
    } catch (error) {
        console.error(`❌ Error handling painting click: ${error.message}`);
        return {
            success: false,
            message: `Error processing repository: ${error.message}`
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

// Export for use in gallery.js
export { processRepoForFlipboard, createTextFlipboard, createHtmlFlipboard };

console.log('🎯 Flipboard integration module loaded');
