/**
 * Gallery Paintings System - API Integration
 * Fetches GitHub uploads from API and displays them as interactive paintings
 */

console.log('🎨 Gallery module loading...');

import { 
  TRIGGER_DISTANCE, 
  TRIGGER_COOLDOWN, 
  LOOK_PRECISION 
} from './config.js';
import { getPlayerPosition } from './player.js';

// =============================================================================
// GALLERY PAINTINGS CONFIGURATION
// =============================================================================

/**
 * Interactive gallery paintings positioned on walls
 * These will be populated from API data
 */
export let galleryFrames = [
  // Default paintings (will be replaced by API data)
  { x: 11, y: 6, url: 'https://github.com', title: 'Loading...', user: 'system' },
  { x: 1, y: 6, url: 'https://github.com', title: 'Loading...', user: 'system' },
  { x: 6, y: 1, url: 'https://github.com', title: 'Loading...', user: 'system' },
  { x: 6, y: 11, url: 'https://github.com', title: 'Loading...', user: 'system' },
  { x: 3, y: 1, url: 'https://github.com', title: 'Loading...', user: 'system' },
  { x: 8, y: 11, url: 'https://github.com', title: 'Loading...', user: 'system' },
];

// =============================================================================
// API INTEGRATION
// =============================================================================

/**
 * Fetch uploads from API and update gallery paintings
 */
async function loadGalleryData() {
  console.log('🎨 Loading gallery data from API...');
  
  try {
    // Try multiple API endpoints
    const apiUrls = [
      '/uploads',
      './uploads',
      'uploads',
      'https://i558110.hera.fontysict.net/api-testing/uploads'
    ];
    
    let uploads = null;
    for (const apiUrl of apiUrls) {
      try {
        console.log(`Trying API endpoint: ${apiUrl}`);
        const response = await fetch(apiUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          uploads = await response.json();
          console.log(`✅ Successfully loaded from: ${apiUrl}`, uploads);
          break;
        }
      } catch (err) {
        console.log(`❌ Failed to load from ${apiUrl}:`, err.message);
      }
    }
    
    if (!uploads || !Array.isArray(uploads)) {
      console.log('⚠️ No valid uploads data, using demo data');
      uploads = createDemoData();
    }
    
    // Update gallery frames with API data
    updateGalleryFrames(uploads);
    
  } catch (error) {
    console.error('❌ Error loading gallery data:', error);
    // Use demo data as fallback
    updateGalleryFrames(createDemoData());
  }
}

/**
 * Create demo data for testing
 */
function createDemoData() {
  return [
    {
      github_url: 'https://github.com/JenWillems/Tipsy-Dragon-Game',
      timestamp: new Date().toISOString(),
      user_name: 'JenWillems',
      repo_name: 'Tipsy-Dragon-Game'
    },
    {
      github_url: 'https://github.com/electromalina/flipdots-project',
      timestamp: new Date().toISOString(),
      user_name: 'electromalina',
      repo_name: 'flipdots-project'
    },
    {
      github_url: 'https://github.com/octocat/Hello-World',
      timestamp: new Date().toISOString(),
      user_name: 'octocat',
      repo_name: 'Hello-World'
    }
  ];
}

/**
 * Update gallery frames with upload data
 * @param {Array} uploads - Array of upload objects from API
 */
function updateGalleryFrames(uploads) {
  console.log('🖼️ Updating gallery frames with data:', uploads);
  
  // Fixed painting positions on the walls
  const positions = [
    { x: 11, y: 6 },  // Right wall center
    { x: 1, y: 6 },   // Left wall center  
    { x: 6, y: 1 },   // Top wall center
    { x: 6, y: 11 },  // Bottom wall center
    { x: 3, y: 1 },   // Top wall left
    { x: 8, y: 11 },  // Bottom wall right
  ];
  
  // Clear existing frames
  galleryFrames.length = 0;
  
  // Create new frames from uploads (up to 6)
  const maxPaintings = Math.min(uploads.length, positions.length);
  
  for (let i = 0; i < maxPaintings; i++) {
    const upload = uploads[i];
    const position = positions[i];
    
    // Use original GitHub URL directly (not runnable version)
    const githubUrl = upload.github_url;
    
    galleryFrames.push({
      x: position.x,
      y: position.y,
      url: githubUrl,  // Use original GitHub repo URL
      originalUrl: githubUrl,
      title: upload.repo_name || 'Unknown Repository',
      user: upload.user_name || 'Unknown User',
      timestamp: upload.timestamp || new Date().toISOString(),
      lastTrigger: 0
    });
  }
  
  // Fill remaining positions with default entries if needed
  while (galleryFrames.length < positions.length) {
    const position = positions[galleryFrames.length];
    galleryFrames.push({
      x: position.x,
      y: position.y,
      url: 'https://github.com',
      originalUrl: 'https://github.com',
      title: 'Empty Slot',
      user: 'system',
      timestamp: new Date().toISOString(),
      lastTrigger: 0
    });
  }
  
  console.log(`✅ Gallery updated with ${galleryFrames.length} paintings`);
  
  // Log painting info for debugging
  galleryFrames.forEach((frame, i) => {
    console.log(`🖼️ Painting ${i + 1}: "${frame.title}" by ${frame.user} at (${frame.x}, ${frame.y})`);
  });
}


// =============================================================================
// GALLERY INTERACTION SYSTEM
// =============================================================================

/**
 * Update gallery painting interactions
 * Checks if player is looking at any painting and triggers if conditions are met
 * @param {HTMLCanvasElement} canvas - Canvas element for focus restoration
 * @param {Function} clearMovementKeys - Function to clear movement keys
 * @returns {boolean} True if any painting was triggered
 */
export async function updateGalleryInteractions(canvas, clearMovementKeys) {
  const now = performance.now();
  const { x: px, y: py, angle: pa } = getPlayerPosition();
  
  for (let i = 0; i < galleryFrames.length; i++) {
    const gf = galleryFrames[i];
    if (!gf.lastTrigger) gf.lastTrigger = 0;
    
    const dist = Math.hypot(gf.x - px, gf.y - py);
    
    // Check if player is looking directly at the painting
    const angle = Math.atan2(gf.y - py, gf.x - px);
    let delta = angle - pa;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta)); // Normalize to [-π, π]
    
    // Trigger if: close enough + looking at it + cooldown expired
    if (dist < TRIGGER_DISTANCE && 
        Math.abs(delta) < LOOK_PRECISION && 
        now - gf.lastTrigger > TRIGGER_COOLDOWN) {
      
      console.log(`🖼️ Triggering painting: "${gf.title}" by ${gf.user}`);
      console.log(`🔗 Opening GitHub repository: ${gf.url}`);
      
      // Show info about the painting
      const info = `🎨 "${gf.title}" by ${gf.user}\n🔗 Opening GitHub repo: ${gf.url}`;
      console.log(info);
      
      // Trigger backend repo download instead of opening GitHub directly
      try {
        await triggerRepoDownload(gf.url);
      } catch (e) {
        console.error('Download trigger failed:', e);
      }
      
      clearMovementKeys(); // Prevent movement during trigger
      gf.lastTrigger = now;
      canvas.focus && canvas.focus();
      return true; // Only trigger one painting per frame
    }
  }
  
  return false;
}

// =============================================================================
// GALLERY MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Get gallery frame information for a specific index
 * @param {number} index - Gallery frame index
 * @returns {Object|null} Gallery frame object or null if invalid index
 */
export function getGalleryFrame(index) {
  if (index < 0 || index >= galleryFrames.length) return null;
  return galleryFrames[index];
}

/**
 * Get the total number of gallery frames
 * @returns {number} Number of gallery frames
 */
export function getGalleryFrameCount() {
  return galleryFrames.length;
}

/**
 * Refresh gallery data from API
 */
export async function refreshGallery() {
  console.log('🔄 Refreshing gallery data...');
  return await loadGalleryData();
}

// =============================================================================
// INITIALIZATION
// =============================================================================

// Load gallery data when module loads
console.log('🎨 Gallery system initializing...');
loadGalleryData();

// Refresh gallery data every 30 seconds
setInterval(() => {
  console.log('🔄 Auto-refreshing gallery data...');
  loadGalleryData();
}, 30000);

// Debug: Confirm exports are available
console.log('🎨 Gallery module exports ready:', {
  updateGalleryInteractions: typeof updateGalleryInteractions,
  getGalleryFrameCount: typeof getGalleryFrameCount,
  refreshGallery: typeof refreshGallery,
  galleryFrames: galleryFrames.length + ' frames'
});

// =============================================================================
// DOWNLOAD HELPER
// =============================================================================

async function triggerRepoDownload(githubUrl) {
  const endpoints = [
    '/download-repo',
    './download-repo',
    'download-repo',
    'https://i558110.hera.fontysict.net/api-testing/download-repo'
  ];
  let lastError = null;
  for (const ep of endpoints) {
    try {
      console.log(`⬇️ Triggering download via ${ep} for ${githubUrl}`);
      const res = await fetch(ep, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ url: githubUrl })
      });
      const json = await res.json().catch(() => ({}));
      console.log(`📡 Response from ${ep}:`, { status: res.status, ok: res.ok, json });
      
      if (res.ok && json && json.success) {
        console.log('✅ Download started:', json);
        // Optional: simple user feedback
        alert('Repo download started on flipboard: ' + (json.target_dir || ''));
        return true;
      }
      console.warn('Endpoint responded but not success:', { status: res.status, json });
      lastError = { status: res.status, json, endpoint: ep };
    } catch (err) {
      console.warn(`Endpoint ${ep} failed:`, err.message);
      lastError = err;
    }
  }
  throw new Error('All download endpoints failed: ' + (lastError ? (lastError.message || JSON.stringify(lastError)) : 'unknown error'));
}
