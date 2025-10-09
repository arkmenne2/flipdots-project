/**
 * =============================================================================
 * BROWSER FLIPBOARD INTEGRATION - REPOSITORY DISPLAY SYSTEM
 * =============================================================================
 * 
 * This script provides browser-compatible flipboard integration that works
 * directly in the browser when paintings are clicked in the 3D gallery.
 * 
 * Features:
 * - Works directly in browser without server dependencies
 * - Displays repository information on flipboard
 * - Provides multiple access methods for repository content
 * - Creates flipboard displays with repository metadata
 * - Automatic processing when walking into paintings
 * 
 * Author: Flipboard Project Team
 * Last Updated: 2024
 * =============================================================================
 */

// =============================================================================
// FLIPBOARD CONFIGURATION
// =============================================================================

/** Flipboard display dimensions */
const FLIPBOARD_WIDTH = 84;
const FLIPBOARD_HEIGHT = 28;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Extract repository information from GitHub URL
 * @param {string} githubUrl - GitHub repository URL
 */
function extractRepoInfo(githubUrl) {
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/);
    if (match) {
        return {
            owner: match[1],
            name: match[2],
            branch: match[3] || 'main',
            fullName: `${match[1]}/${match[2]}`,
            rawUrl: `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3] || 'main'}`,
            pagesUrl: `https://${match[1]}.github.io/${match[2]}`,
            githackUrl: `https://raw.githack.com/${match[1]}/${match[2]}/${match[3] || 'main'}`
        };
    }
    return null;
}

/**
 * Create flipboard image with repository information
 * @param {Object} repoInfo - Repository information
 * @param {string} repoName - Repository name
 */
function createRepoInfoFlipboard(repoInfo, repoName) {
    console.log(`🎨 Creating repository info flipboard: ${repoName}`);
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = FLIPBOARD_WIDTH;
    canvas.height = FLIPBOARD_HEIGHT;
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
    ctx.fillText(title, FLIPBOARD_WIDTH / 2, 6);
    
    // Draw owner info
    const ownerInfo = `by ${repoInfo.owner}`.substring(0, 20);
    ctx.fillText(ownerInfo, FLIPBOARD_WIDTH / 2, 14);
    
    // Draw branch info
    const branchInfo = `branch: ${repoInfo.branch}`.substring(0, 20);
    ctx.fillText(branchInfo, FLIPBOARD_WIDTH / 2, 22);
    
    return canvas;
}

/**
 * Create flipboard image with access methods
 * @param {Object} repoInfo - Repository information
 * @param {string} repoName - Repository name
 */
function createAccessMethodsFlipboard(repoInfo, repoName) {
    console.log(`🎨 Creating access methods flipboard: ${repoName}`);
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = FLIPBOARD_WIDTH;
    canvas.height = FLIPBOARD_HEIGHT;
    const ctx = canvas.getContext('2d');
    
    // Black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, FLIPBOARD_WIDTH, FLIPBOARD_HEIGHT);
    
    // White text
    ctx.fillStyle = 'white';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    
    // Draw title
    const title = 'Access Methods';
    ctx.fillText(title, FLIPBOARD_WIDTH / 2, 6);
    
    // Draw access methods
    const methods = [
        '1. GitHub Pages',
        '2. Raw Files',
        '3. GitHack'
    ];
    
    methods.forEach((method, index) => {
        ctx.fillText(method, FLIPBOARD_WIDTH / 2, 14 + (index * 8));
    });
    
    return canvas;
}

/**
 * Create flipboard image with custom message
 * @param {string} message - Message to display
 * @param {string} title - Title for the display
 */
function createMessageFlipboard(message, title) {
    console.log(`🎨 Creating message flipboard: ${title}`);
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = FLIPBOARD_WIDTH;
    canvas.height = FLIPBOARD_HEIGHT;
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

/**
 * Display flipboard image in browser
 * @param {HTMLCanvasElement} canvas - Canvas element with flipboard image
 * @param {string} title - Title for the display
 */
function displayFlipboardInBrowser(canvas, title) {
    // Create a modal to display the flipboard image
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: 'Courier New', monospace;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: #000;
        border: 2px solid #fff;
        padding: 20px;
        text-align: center;
        color: #fff;
        max-width: 90%;
        max-height: 90%;
        overflow: auto;
    `;
    
    const titleElement = document.createElement('h2');
    titleElement.textContent = `🎯 ${title}`;
    titleElement.style.cssText = `
        margin: 0 0 20px 0;
        color: #fff;
        font-size: 1.5em;
    `;
    
    const canvasContainer = document.createElement('div');
    canvasContainer.style.cssText = `
        margin: 20px 0;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    `;
    
    // Scale up the canvas for better visibility
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = FLIPBOARD_WIDTH * 4; // 4x scale
    scaledCanvas.height = FLIPBOARD_HEIGHT * 4;
    const scaledCtx = scaledCanvas.getContext('2d');
    
    // Draw the original canvas scaled up
    scaledCtx.imageSmoothingEnabled = false; // Pixelated look
    scaledCtx.drawImage(canvas, 0, 0, FLIPBOARD_WIDTH * 4, FLIPBOARD_HEIGHT * 4);
    
    scaledCanvas.style.cssText = `
        border: 2px solid #fff;
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
    `;
    
    const info = document.createElement('div');
    info.style.cssText = `
        margin: 20px 0;
        color: #ccc;
        font-size: 0.9em;
    `;
    info.innerHTML = `
        <p>📏 Dimensions: ${FLIPBOARD_WIDTH} × ${FLIPBOARD_HEIGHT} pixels</p>
        <p>🎨 Ready for flipboard display</p>
    `;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
        background: #000;
        color: #fff;
        border: 2px solid #fff;
        padding: 10px 20px;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        cursor: pointer;
        margin-top: 20px;
    `;
    closeButton.onclick = () => {
        document.body.removeChild(modal);
    };
    
    // Assemble the modal
    canvasContainer.appendChild(scaledCanvas);
    canvasContainer.appendChild(info);
    content.appendChild(titleElement);
    content.appendChild(canvasContainer);
    content.appendChild(closeButton);
    modal.appendChild(content);
    
    // Add to page
    document.body.appendChild(modal);
    
    // Auto-close after 10 seconds
    setTimeout(() => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    }, 10000);
}

// =============================================================================
// MAIN INTEGRATION FUNCTION
// =============================================================================

/**
 * Handle painting click - create flipboard display with repository info
 * @param {string} githubUrl - GitHub repository URL
 * @param {string} repoName - Repository name
 */
export async function handlePaintingClick(githubUrl, repoName) {
    console.log(`🎨 Painting clicked: ${repoName} (${githubUrl})`);
    console.log(`🚀 Processing repository for flipboard display...`);
    
    try {
        // Extract repository information
        const repoInfo = extractRepoInfo(githubUrl);
        if (!repoInfo) {
            throw new Error('Invalid GitHub URL');
        }
        
        console.log(`📋 Repository info: ${repoInfo.fullName} (${repoInfo.branch})`);
        
        // Create flipboard image with repository info
        const canvas = createRepoInfoFlipboard(repoInfo, repoName);
        
        // Display the flipboard image in browser
        displayFlipboardInBrowser(canvas, `Repository: ${repoName}`);
        
        console.log(`✅ Flipboard image created and displayed`);
        console.log(`📄 Repository: ${repoInfo.fullName}`);
        console.log(`🌿 Branch: ${repoInfo.branch}`);
        console.log(`🔗 Access URLs:`);
        console.log(`   - GitHub Pages: ${repoInfo.pagesUrl}`);
        console.log(`   - Raw Files: ${repoInfo.rawUrl}`);
        console.log(`   - GitHack: ${repoInfo.githackUrl}`);
        
        return {
            success: true,
            message: `Repository "${repoName}" is now displayed on the flipboard!`,
            repoInfo: repoInfo,
            accessUrls: {
                pages: repoInfo.pagesUrl,
                raw: repoInfo.rawUrl,
                githack: repoInfo.githackUrl
            }
        };
        
    } catch (error) {
        console.error(`❌ Error processing repository: ${error.message}`);
        
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
        // Create flipboard image
        const canvas = createMessageFlipboard(message, title);
        
        // Display the flipboard image in browser
        displayFlipboardInBrowser(canvas, title);
        
        console.log(`✅ Custom flipboard image created and displayed`);
        
        return {
            success: true,
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

// Export for use in gallery.js
export { createRepoInfoFlipboard, createMessageFlipboard, extractRepoInfo, displayFlipboardInBrowser };

console.log('🎯 Browser flipboard integration module loaded');
