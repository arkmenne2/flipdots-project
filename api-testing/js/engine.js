/**
 * Raycasting Engine and Rendering System
 * Core 3D rendering engine with raycasting and post-processing
 */

import { 
  FOV, 
  RAY_STEP_SIZE, 
  MAX_RAY_STEPS, 
  SMOOTH_FACTOR,
  PILLAR_THICKNESS,
  FRAME_THICKNESS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DOT_OFFSET_FACTOR,
  PLAYER_DOT_SIZE,
  GALLERY_DOT_SIZE,
  DIRECTION_LINE_LENGTH
} from './config.js';
import { isWall, nonCornerPoints, mapW, mapH, map } from './world.js';
import { getPlayerPosition } from './player.js';
import { galleryFrames } from './gallery.js';

// =============================================================================
// CANVAS AND CONTEXT MANAGEMENT
// =============================================================================

let canvas, post, off, mini;
let pctx, octx, mctx, fctx;
let useThree = false;
let renderer, scene, camera, texture;

/**
 * Initialize all canvas contexts and Three.js setup
 * @param {HTMLCanvasElement} mainCanvas - Main rendering canvas
 * @param {HTMLCanvasElement} postCanvas - Overlay canvas
 * @param {HTMLCanvasElement} minimapCanvas - Minimap canvas
 */
export function initializeEngine(mainCanvas, postCanvas, minimapCanvas) {
  canvas = mainCanvas;
  post = postCanvas;
  mini = minimapCanvas;
  
  // Initialize contexts
  pctx = post.getContext('2d', { willReadFrequently: true });
  mctx = mini.getContext('2d', { willReadFrequently: true });
  
  // Create offscreen buffer
  off = document.createElement('canvas');
  off.width = canvas.width;
  off.height = canvas.height;
  octx = off.getContext('2d', { willReadFrequently: true });
  
  // Try to initialize Three.js for hardware acceleration
  try {
    if (window.THREE) {
      renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: false, 
        alpha: false, 
        preserveDrawingBuffer: true 
      });
      renderer.setSize(canvas.width, canvas.height, false);
      renderer.setPixelRatio(1);
      
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      
      texture = new THREE.CanvasTexture(off);
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(quad);
      
      useThree = true;
    }
  } catch (e) {
    useThree = false;
  }
  
  if (!useThree) {
    fctx = canvas.getContext('2d', { willReadFrequently: true });
  }
}

// =============================================================================
// PERFORMANCE BUFFERS
// =============================================================================

/** Smoothed depth values for each screen column */
let smoothDepth = new Float32Array(CANVAS_WIDTH);

/** Smoothed wall height ratios for each screen column */
let smoothSize = new Float32Array(CANVAS_WIDTH);

/** Cached cosine values for ray angles */
let cachedCos = new Float32Array(CANVAS_WIDTH);

/** Cached sine values for ray angles */
let cachedSin = new Float32Array(CANVAS_WIDTH);

/** Flag to track if angle cache needs updating */
let cacheValid = false;

/**
 * Invalidate the angle cache (call when player rotates)
 */
export function invalidateCache() {
  cacheValid = false;
}

// =============================================================================
// RAYCASTING CORE
// =============================================================================

/**
 * Cast a ray and find the first wall intersection
 * Uses DDA (Digital Differential Analyzer) stepping algorithm
 * @param {number} rayAngle - Ray direction in radians
 * @returns {{dist: number, hitX: number, hitY: number}} Hit information
 */
function castRay(rayAngle) {
  const { x: px, y: py } = getPlayerPosition();
  let x = px, y = py;
  const stepX = Math.cos(rayAngle);
  const stepY = Math.sin(rayAngle);
  let dist = 0;
  
  // Step along ray until wall hit or max distance reached
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

// =============================================================================
// MAIN RENDERING ENGINE
// =============================================================================

/**
 * Render the 3D scene using raycasting
 * Outputs to offscreen buffer, then composites to main canvas
 */
export function render() {
  const { x: px, y: py, angle: pa } = getPlayerPosition();
  
  // Clear offscreen buffer
  octx.fillStyle = '#000';
  octx.fillRect(0, 0, canvas.width, canvas.height);

  // Initialize per-frame buffers
  const yTop = new Int16Array(canvas.width);
  const yBot = new Int16Array(canvas.width);
  const colDepth = new Float32Array(canvas.width);
  const colLineH = new Int16Array(canvas.width);
  
  // Ensure performance buffers match canvas width
  if (smoothDepth.length !== canvas.width) {
    smoothDepth = new Float32Array(canvas.width);
    smoothSize = new Float32Array(canvas.width);
    cachedCos = new Float32Array(canvas.width);
    cachedSin = new Float32Array(canvas.width);
    cacheValid = false;
  }

  // Update angle cache if needed
  if (!cacheValid) {
    for (let x = 0; x < canvas.width; x++) {
      const camX = (x / canvas.width) * 2 - 1;
      const rayAngle = pa + camX * (FOV / 2);
      cachedCos[x] = Math.cos(rayAngle - pa);
      cachedSin[x] = Math.sin(rayAngle - pa);
    }
    cacheValid = true;
  }

  // Main raycasting loop
  for (let x = 0; x < canvas.width; x++) {
    const camX = (x / canvas.width) * 2 - 1;
    const rayAngle = pa + camX * (FOV / 2);
    const hit = castRay(rayAngle);
    
    // Apply perspective correction
    const perpDist = hit.dist * cachedCos[x];
    const lineH = Math.min(canvas.height, Math.max(1, Math.round(canvas.height / perpDist)));

    const y0 = Math.floor((canvas.height - lineH) / 2);
    const y1 = y0 + lineH;
    
    yTop[x] = y0;
    yBot[x] = y1;
    colDepth[x] = Math.min(1, Math.max(0, perpDist / 8));
    colLineH[x] = lineH;
    
    octx.fillRect(x, y0, 1, lineH);
  }

  // Apply wall smoothing
  for (let pass = 0; pass < 2; pass++) {
    for (let x = 1; x < canvas.width - 1; x++) {
      yTop[x] = Math.round((yTop[x - 1] + yTop[x] + yTop[x + 1]) / 3);
      yBot[x] = Math.round((yBot[x - 1] + yBot[x] + yBot[x + 1]) / 3);
    }
  }

  // Apply depth smoothing
  for (let x = 0; x < canvas.width; x++) {
    const d = colDepth[x];
    const prev = smoothDepth[x] || d;
    smoothDepth[x] = prev * (1 - SMOOTH_FACTOR) + d * SMOOTH_FACTOR;
  }

  for (let x = 0; x < canvas.width; x++) {
    const h = Math.max(1, yBot[x] - yTop[x]);
    const ratio = h / canvas.height;
    const prev = smoothSize[x] || ratio;
    smoothSize[x] = prev * (1 - SMOOTH_FACTOR) + ratio * SMOOTH_FACTOR;
  }

  // Project geometry to screen
  const cornerCols = new Array(canvas.width).fill(false);
  const frameCols = new Array(canvas.width).fill(false);
  const halfFov = FOV / 2;
  
  // Project corner points for pillars
  for (let i = 0; i < nonCornerPoints.length; i++) {
    const cp = nonCornerPoints[i];
    const dx = (cp.x + 0.0001) - px;
    const dy = (cp.y + 0.0001) - py;
    const cornerAngle = Math.atan2(dy, dx);
    
    let delta = cornerAngle - pa;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    
    if (Math.abs(delta) > halfFov) continue;
    
    const testHit = castRay(pa + delta);
    const distCorner = Math.hypot(dx, dy);
    if (testHit.dist + 0.03 < distCorner) continue;
    
    const colFloat = (delta / halfFov) * (canvas.width / 2) + (canvas.width / 2);
    const col = Math.round(colFloat);
    
    for (let t = -Math.floor(PILLAR_THICKNESS / 2); t <= Math.floor((PILLAR_THICKNESS - 1) / 2); t++) {
      const cx = col + t;
      if (cx >= 0 && cx < canvas.width) cornerCols[cx] = true;
    }
  }

  // Project gallery frames
  for (let i = 0; i < galleryFrames.length; i++) {
    const gf = galleryFrames[i];
    const dx = (gf.x + 0.0001) - px;
    const dy = (gf.y + 0.0001) - py;
    const angle = Math.atan2(dy, dx);
    
    let delta = angle - pa;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    
    if (Math.abs(delta) <= halfFov * 1.2) {
      const testHit = castRay(pa + delta);
      const dist = Math.hypot(dx, dy);
      
      if (testHit.dist + 2 >= dist) {
        const colFloat = (delta / halfFov) * (canvas.width / 2) + (canvas.width / 2);
        const colCenter = Math.round(colFloat);
        
        for (let t = -Math.floor(FRAME_THICKNESS / 2); t <= Math.floor((FRAME_THICKNESS - 1) / 2); t++) {
          const cx = colCenter + t;
          if (cx >= 0 && cx < canvas.width) frameCols[cx] = true;
        }
      }
    }
  }

  // Render to main canvas
  if (useThree && texture) {
    texture.needsUpdate = true;
    renderer.render(scene, camera);
  } else if (fctx) {
    fctx.clearRect(0, 0, canvas.width, canvas.height);
    fctx.drawImage(off, 0, 0);
  }

  // Render overlay elements
  renderOverlay(yTop, yBot, cornerCols, frameCols);
}

/**
 * Render UI overlay elements (pillars, frames, edge lines)
 * @param {Int16Array} yTop - Top wall positions
 * @param {Int16Array} yBot - Bottom wall positions  
 * @param {boolean[]} cornerCols - Columns with pillars
 * @param {boolean[]} frameCols - Columns with frames
 */
function renderOverlay(yTop, yBot, cornerCols, frameCols) {
  pctx.clearRect(0, 0, post.width, post.height);

  // Draw pillars
  pctx.fillStyle = '#fff';
  for (let x = 0; x < canvas.width; x++) {
    if (!cornerCols[x]) continue;
    const y0 = Math.max(0, yTop[x]);
    const y1 = Math.min(post.height, yBot[x]);
    if (y1 > y0) pctx.fillRect(x, y0, 1, y1 - y0);
  }

  // Draw gallery frames
  pctx.fillStyle = '#fff';
  let frameLeft = null, frameRight = null, frameY0 = 0, frameY1 = 0;
  
  for (let x = 0; x < canvas.width; x++) {
    if (!frameCols[x]) continue;
    const y0 = Math.max(0, yTop[x]);
    const y1 = Math.min(post.height, yBot[x]);
    
    const inset = Math.max(1, Math.floor((y1 - y0) * 0.2));
    const sy0 = y0 + inset;
    const sy1 = y1 - inset;
    
    if (sy1 > sy0) pctx.fillRect(x, sy0, 1, sy1 - sy0);
    
    if (frameLeft === null || x < frameLeft) frameLeft = x;
    if (frameRight === null || x > frameRight) frameRight = x;
    frameY0 = sy0; 
    frameY1 = sy1;
  }
  
  if (frameLeft !== null && frameRight !== null && frameRight >= frameLeft) {
    pctx.fillRect(frameLeft, frameY0, frameRight - frameLeft + 1, 1);
    pctx.fillRect(frameLeft, frameY1, frameRight - frameLeft + 1, 1);
  }

  // Draw wall edge lines
  pctx.fillStyle = '#fff';
  for (let x = 0; x < canvas.width; x++) {
    const topY = Math.max(0, Math.min(post.height - 1, yTop[x]));
    const botY = Math.max(0, Math.min(post.height - 1, yBot[x] - 1));
    const s = smoothSize[x];
    
    const thickness = (s > 0.66) ? 3 : (s > 0.33 ? 2 : 1);
    
    pctx.fillRect(x, Math.max(0, topY - Math.floor((thickness - 1) / 2)), 1, thickness);
    pctx.fillRect(x, Math.max(0, botY - Math.floor(thickness / 2)), 1, thickness);
  }
}

// =============================================================================
// MINIMAP RENDERING
// =============================================================================

/**
 * Render development minimap showing player position and gallery paintings
 */
export function renderMinimap() {
  const { x: px, y: py, angle: pa } = getPlayerPosition();
  const w = mini.width, h = mini.height;
  
  mctx.fillStyle = '#fff';
  mctx.fillRect(0, 0, w, h);

  const cellX = Math.floor(w / mapW);
  const cellY = Math.floor(h / mapH);
  const cell = Math.min(cellX, cellY);
  const offsetX = Math.floor((w - cell * mapW) / 2);
  const offsetY = Math.floor((h - cell * mapH) / 2);

  // Draw map walls
  mctx.fillStyle = '#000';
  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      if (map[y][x] === 1) {
        mctx.fillRect(offsetX + x * cell, offsetY + y * cell, cell, cell);
      }
    }
  }

  // Draw gallery paintings with different colors
  const markerColors = [
    '#ff0000', // Red
    '#00ff00', // Green
    '#0000ff', // Blue
    '#ffff00', // Yellow
    '#ff00ff', // Magenta
    '#00ffff', // Cyan
    '#ff8800', // Orange
    '#8800ff', // Purple
    '#ff0088', // Pink
    '#00ff88', // Light Green
  ];
  
  for (let i = 0; i < galleryFrames.length; i++) {
    const gf = galleryFrames[i];
    
    // Skip empty slots
    if (gf.title === 'Empty Slot' || gf.url === 'https://github.com') {
      continue;
    }
    
    // Use color based on index, cycling through the array
    const colorIndex = i % markerColors.length;
    mctx.fillStyle = markerColors[colorIndex];
    
    let gx = offsetX + gf.x * cell;
    let gy = offsetY + gf.y * cell;
    
    const offsetAmount = cell * DOT_OFFSET_FACTOR;
    
    if (gf.x === 1) gx += offsetAmount;
    if (gf.x === mapW - 1) gx -= offsetAmount;
    if (gf.y === 1) gy += offsetAmount;
    if (gf.y === 11) gy -= offsetAmount;
    
    const r = Math.max(2, Math.floor(cell * GALLERY_DOT_SIZE));
    mctx.beginPath();
    mctx.arc(gx, gy, r, 0, Math.PI * 2);
    mctx.fill();
    
    // Add a white border to make markers more visible
    mctx.strokeStyle = '#fff';
    mctx.lineWidth = 1;
    mctx.stroke();
  }

  // Draw player position and direction
  const pxp = offsetX + px * cell;
  const pyp = offsetY + py * cell;
  
  mctx.fillStyle = '#000';
  mctx.beginPath();
  mctx.arc(pxp, pyp, Math.max(2, cell * PLAYER_DOT_SIZE), 0, Math.PI * 2);
  mctx.fill();
  
  const lx = pxp + Math.cos(pa) * cell * DIRECTION_LINE_LENGTH;
  const ly = pyp + Math.sin(pa) * cell * DIRECTION_LINE_LENGTH;
  mctx.beginPath();
  mctx.moveTo(pxp, pyp);
  mctx.lineTo(lx, ly);
  mctx.strokeStyle = '#000';
  mctx.lineWidth = 2;
  mctx.stroke();
}
