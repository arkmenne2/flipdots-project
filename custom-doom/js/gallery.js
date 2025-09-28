/**
 * Gallery Paintings System
 * Handles interactive gallery paintings and their triggers
 */

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
 * Each painting triggers when player looks at it from close range
 */
export const galleryFrames = [
  { x: 11, y: 6, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, // Right wall center
  { x: 1, y: 6, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },  // Left wall center
  { x: 6, y: 1, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },  // Top wall center
  { x: 6, y: 11, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, // Bottom wall center
  { x: 3, y: 1, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },  // Top wall left
  { x: 8, y: 11, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, // Bottom wall right
];

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
export function updateGalleryInteractions(canvas, clearMovementKeys) {
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
      
      window.open(gf.url, '_blank');
      clearMovementKeys(); // Prevent movement during trigger
      gf.lastTrigger = now;
      canvas.focus && canvas.focus();
      return true; // Only trigger one painting per frame
    }
  }
  
  return false;
}

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
 * Add a new gallery frame
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate  
 * @param {string} url - URL to open when triggered
 */
export function addGalleryFrame(x, y, url) {
  galleryFrames.push({ x, y, url, lastTrigger: 0 });
}

/**
 * Remove a gallery frame by index
 * @param {number} index - Index to remove
 * @returns {boolean} True if removed successfully
 */
export function removeGalleryFrame(index) {
  if (index < 0 || index >= galleryFrames.length) return false;
  galleryFrames.splice(index, 1);
  return true;
}

