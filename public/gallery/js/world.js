/**
 * World Map and Geometry
 * Handles map data, collision detection, and wall geometry computation
 */

// =============================================================================
// WORLD MAP DEFINITION
// =============================================================================

/**
 * World map layout
 * 0 = empty space (walkable)
 * 1 = wall
 * 2 = interactive item (opens example.com)
 * 3 = interactive item (shows alert)
 */
export const map = [
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,1],
  [1,1,1,1,1,1,1,1,1,1,1],
];

/** Map dimensions */
export const mapW = map[0].length;
export const mapH = map.length;

// =============================================================================
// COLLISION DETECTION
// =============================================================================

/**
 * Check if a tile coordinate contains a wall
 * @param {number} tx - Tile X coordinate
 * @param {number} ty - Tile Y coordinate
 * @returns {boolean} True if wall, false if empty
 */
export function tileIsWall(tx, ty) {
  // Treat out-of-bounds as walls for boundary detection
  if (tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) return true;
  return map[ty][tx] === 1;
}

/**
 * Check if a world coordinate contains a wall
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @returns {number} 1 if wall, 0 if empty
 */
export function isWall(x, y) {
  if (x < 0 || y < 0 || x >= mapW || y >= mapH) return 1;
  return map[Math.floor(y)][Math.floor(x)] === 1 ? 1 : 0;
}

/**
 * Get the tile value at a specific coordinate
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @returns {number} Tile value (0=empty, 1=wall, 2=item1, 3=item2)
 */
export function getTileValue(x, y) {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) return 1;
  return map[ty][tx];
}

// =============================================================================
// WALL GEOMETRY COMPUTATION
// =============================================================================

/**
 * Find all L-shaped wall corners for pillar rendering
 * @returns {Array<{x: number, y: number}>} Array of corner points
 */
export function computeWallCorners() {
  const points = [];
  
  // Check each grid intersection point
  for (let y = 0; y <= mapH; y++) {
    for (let x = 0; x <= mapW; x++) {
      // Check the four adjacent tiles
      const topLeft = tileIsWall(x - 1, y - 1);
      const topRight = tileIsWall(x, y - 1);
      const bottomLeft = tileIsWall(x - 1, y);
      const bottomRight = tileIsWall(x, y);
      
      const wallCount = (topLeft ? 1 : 0) + (topRight ? 1 : 0) + 
                       (bottomLeft ? 1 : 0) + (bottomRight ? 1 : 0);
      
      // We want L-corners (exactly 2 adjacent walls, not diagonal)
      if (wallCount !== 2) continue;
      
      const diagonal = (topLeft && bottomRight) || (topRight && bottomLeft);
      if (diagonal) continue; // Skip diagonal configurations
      
      points.push({ x, y });
    }
  }
  return points;
}

/**
 * Find all non-corner wall-adjacent points for additional geometry
 * @returns {Array<{x: number, y: number}>} Array of non-corner points
 */
export function computeNonCornerPoints() {
  const points = [];
  
  for (let y = 0; y <= mapH; y++) {
    for (let x = 0; x <= mapW; x++) {
      const topLeft = tileIsWall(x - 1, y - 1);
      const topRight = tileIsWall(x, y - 1);
      const bottomLeft = tileIsWall(x - 1, y);
      const bottomRight = tileIsWall(x, y);
      
      const wallCount = (topLeft ? 1 : 0) + (topRight ? 1 : 0) + 
                       (bottomLeft ? 1 : 0) + (bottomRight ? 1 : 0);
      
      // Skip empty spaces and completely solid areas
      if (wallCount === 0 || wallCount === 4) continue;
      
      const diagonal = (topLeft && bottomRight) || (topRight && bottomLeft);
      
      // Keep if not a true L-corner (straight edges or diagonal pairs)
      if (wallCount !== 2 || diagonal) {
        points.push({ x, y });
      }
    }
  }
  return points;
}

// Pre-compute wall geometry for performance
export const cornerPoints = computeWallCorners();
export const nonCornerPoints = computeNonCornerPoints();
