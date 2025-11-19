/**
 * Server-side 3D Room Renderer
 * Converts client-side raycasting engine to server-side canvas rendering
 * Matches the client-side rendering from js/engine.js
 */

// Import config constants
const FOV = Math.PI / 3;
const RAY_STEP_SIZE = 0.05;
const MAX_RAY_STEPS = 64;
const SMOOTH_FACTOR = 0.7;
const PILLAR_THICKNESS = 2; // Match client-side config.js
const FRAME_THICKNESS = 3; // Match client-side config.js

// Import world map and geometry
import { isWall, nonCornerPoints, mapW, mapH } from "../js/world.js";

interface PlayerState {
  x: number;
  y: number;
  angle: number;
}

interface GalleryFrame {
  x: number;
  y: number;
  url: string;
  title: string;
  user: string;
  colorIndex?: number;
}

/**
 * Cast a ray and find the first wall intersection
 */
function castRay(rayAngle: number, px: number, py: number): { dist: number; hitX: number; hitY: number } {
  let x = px, y = py;
  const stepX = Math.cos(rayAngle);
  const stepY = Math.sin(rayAngle);
  let dist = 0;
  
  for (let i = 0; i < MAX_RAY_STEPS; i++) {
    x += stepX * RAY_STEP_SIZE;
    y += stepY * RAY_STEP_SIZE;
    dist += RAY_STEP_SIZE;
    
    if (isWall(x, y)) {
      return { dist: Math.max(dist, 0.0001), hitX: x, hitY: y };
    }
  }
  
  return { dist: Math.max(dist, 0.0001), hitX: x, hitY: y };
}

/**
 * Render the 3D room to canvas
 * Matches the client-side rendering from js/engine.js
 */
export function renderRoom(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  player: PlayerState,
  galleryFrames: GalleryFrame[]
) {
  const { x: px, y: py, angle: pa } = player;
  
  // Clear canvas
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  
  // Initialize buffers (matching client-side)
  const yTop = new Int16Array(width);
  const yBot = new Int16Array(width);
  const colDepth = new Float32Array(width);
  const colLineH = new Int16Array(width);
  
  // Cast rays for each column (main raycasting loop)
  for (let x = 0; x < width; x++) {
    const camX = (x / width) * 2 - 1;
    const rayAngle = pa + camX * (FOV / 2);
    const hit = castRay(rayAngle, px, py);
    
    // Perspective correction
    const perpDist = hit.dist * Math.cos(rayAngle - pa);
    const lineH = Math.min(height, Math.max(1, Math.round(height / perpDist)));
    
    const y0 = Math.floor((height - lineH) / 2);
    const y1 = y0 + lineH;
    
    yTop[x] = y0;
    yBot[x] = y1;
    colDepth[x] = Math.min(1, Math.max(0, perpDist / 8));
    colLineH[x] = lineH;
    
    // Draw wall column (grayscale based on distance)
    const brightness = Math.max(0, Math.min(255, 255 * (1 - colDepth[x])));
    ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
    ctx.fillRect(x, y0, 1, lineH);
  }
  
  // Apply wall smoothing (matching client-side)
  for (let pass = 0; pass < 2; pass++) {
    for (let x = 1; x < width - 1; x++) {
      yTop[x] = Math.round((yTop[x - 1] + yTop[x] + yTop[x + 1]) / 3);
      yBot[x] = Math.round((yBot[x - 1] + yBot[x] + yBot[x + 1]) / 3);
    }
  }
  
  // Project geometry to screen (matching client-side logic)
  const cornerCols = new Array(width).fill(false);
  const frameCols = new Array(width).fill(false);
  const halfFov = FOV / 2;
  
  // Project corner points for pillars (matching client-side)
  for (let i = 0; i < nonCornerPoints.length; i++) {
    const cp = nonCornerPoints[i];
    const dx = (cp.x + 0.0001) - px;
    const dy = (cp.y + 0.0001) - py;
    const cornerAngle = Math.atan2(dy, dx);
    
    let delta = cornerAngle - pa;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    
    if (Math.abs(delta) > halfFov) continue;
    
    const testHit = castRay(pa + delta, px, py);
    const distCorner = Math.hypot(dx, dy);
    if (testHit.dist + 0.03 < distCorner) continue;
    
    const colFloat = (delta / halfFov) * (width / 2) + (width / 2);
    const col = Math.round(colFloat);
    
    // Mark columns for pillar rendering
    for (let t = -Math.floor(PILLAR_THICKNESS / 2); t <= Math.floor((PILLAR_THICKNESS - 1) / 2); t++) {
      const cx = col + t;
      if (cx >= 0 && cx < width) cornerCols[cx] = true;
    }
  }
  
  // Project gallery frames (matching client-side logic)
  for (let i = 0; i < galleryFrames.length; i++) {
    const gf = galleryFrames[i];
    if (gf.title === "Empty Slot" || gf.url === "https://github.com") continue;
    
    const dx = (gf.x + 0.0001) - px;
    const dy = (gf.y + 0.0001) - py;
    const angle = Math.atan2(dy, dx);
    
    let delta = angle - pa;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    
    if (Math.abs(delta) <= halfFov * 1.2) {
      const testHit = castRay(pa + delta, px, py);
      const dist = Math.hypot(dx, dy);
      
      if (testHit.dist + 2 >= dist) {
        const colFloat = (delta / halfFov) * (width / 2) + (width / 2);
        const colCenter = Math.round(colFloat);
        
        // Mark columns for frame rendering
        for (let t = -Math.floor(FRAME_THICKNESS / 2); t <= Math.floor((FRAME_THICKNESS - 1) / 2); t++) {
          const cx = colCenter + t;
          if (cx >= 0 && cx < width) frameCols[cx] = true;
        }
      }
    }
  }
  
  // Render overlay elements (pillars, frames, edge lines) - matching client-side
  ctx.fillStyle = "#fff";
  
  // Draw pillars
  for (let x = 0; x < width; x++) {
    if (!cornerCols[x]) continue;
    const y0 = Math.max(0, yTop[x]);
    const y1 = Math.min(height, yBot[x]);
    if (y1 > y0) ctx.fillRect(x, y0, 1, y1 - y0);
  }
  
  // Draw gallery frames
  let frameLeft: number | null = null;
  let frameRight: number | null = null;
  let frameY0 = 0;
  let frameY1 = 0;
  
  for (let x = 0; x < width; x++) {
    if (!frameCols[x]) continue;
    const y0 = Math.max(0, yTop[x]);
    const y1 = Math.min(height, yBot[x]);
    
    const inset = Math.max(1, Math.floor((y1 - y0) * 0.2));
    const sy0 = y0 + inset;
    const sy1 = y1 - inset;
    
    if (sy1 > sy0) ctx.fillRect(x, sy0, 1, sy1 - sy0);
    
    if (frameLeft === null || x < frameLeft) frameLeft = x;
    if (frameRight === null || x > frameRight) frameRight = x;
    frameY0 = sy0;
    frameY1 = sy1;
  }
  
  // Draw frame borders
  if (frameLeft !== null && frameRight !== null && frameRight >= frameLeft) {
    ctx.fillRect(frameLeft, frameY0, frameRight - frameLeft + 1, 1);
    ctx.fillRect(frameLeft, frameY1, frameRight - frameLeft + 1, 1);
  }
  
  // Draw wall edge lines (matching client-side)
  for (let x = 0; x < width; x++) {
    const topY = Math.max(0, Math.min(height - 1, yTop[x]));
    const botY = Math.max(0, Math.min(height - 1, yBot[x] - 1));
    const s = colLineH[x] / height; // Size ratio
    
    const thickness = (s > 0.66) ? 3 : (s > 0.33 ? 2 : 1);
    
    ctx.fillRect(x, Math.max(0, topY - Math.floor((thickness - 1) / 2)), 1, thickness);
    ctx.fillRect(x, Math.max(0, botY - Math.floor(thickness / 2)), 1, thickness);
  }
  
  // Draw floor and ceiling (as overlay, matching client-side)
  ctx.fillStyle = "rgba(51, 51, 51, 0.5)";
  ctx.fillRect(0, 0, width, height / 2); // Ceiling overlay
  ctx.fillStyle = "rgba(102, 102, 102, 0.5)";
  ctx.fillRect(0, height / 2, width, height / 2); // Floor overlay
}

