/**
 * Configuration and Constants
 * Central location for all game configuration values
 */

// =============================================================================
// GAMEPLAY CONSTANTS
// =============================================================================

/** Distance threshold for triggering gallery paintings */
export const TRIGGER_DISTANCE = 1.0;

/** Cooldown time between gallery triggers (milliseconds) */
export const TRIGGER_COOLDOWN = 2000;

/** Precision threshold for looking at paintings (radians) */
export const LOOK_PRECISION = 0.05;

/** Player movement speed (units per frame at 15fps) */
export const MOVE_SPEED = 2.2 / 15;

/** Player rotation speed (radians per frame at 15fps) */
export const ROTATION_SPEED = 1.8 / 15;

/** Field of view in radians (60 degrees) */
export const FOV = Math.PI / 3;

// =============================================================================
// RENDERING CONSTANTS
// =============================================================================

/** Smoothing factor for depth and size buffers (0-1) */
export const SMOOTH_FACTOR = 0.7;

/** Width of pillar rendering in pixels */
export const PILLAR_THICKNESS = 2;

/** Width of gallery frame rendering in pixels */
export const FRAME_THICKNESS = 3;

/** Target frame rate for consistent gameplay */
export const TARGET_FPS = 15;

// =============================================================================
// RAYCASTING CONSTANTS
// =============================================================================

/** Ray casting step size for DDA algorithm */
export const RAY_STEP_SIZE = 0.05;

/** Maximum ray casting steps to prevent infinite loops */
export const MAX_RAY_STEPS = 64;

// =============================================================================
// CANVAS DIMENSIONS
// =============================================================================

/** Main canvas resolution */
export const CANVAS_WIDTH = 84;
export const CANVAS_HEIGHT = 28;

/** Minimap canvas size */
export const MINIMAP_SIZE = 128;

// =============================================================================
// PLAYER SPAWN POSITION
// =============================================================================

/** Initial player position */
export const SPAWN_X = 2.5;
export const SPAWN_Y = 2.5;
export const SPAWN_ANGLE = 0;

// =============================================================================
// MINIMAP DISPLAY CONSTANTS
// =============================================================================

/** Offset amount for positioning gallery dots on minimap */
export const DOT_OFFSET_FACTOR = 0.3;

/** Player dot size factor on minimap */
export const PLAYER_DOT_SIZE = 0.2;

/** Gallery dot size factor on minimap */
export const GALLERY_DOT_SIZE = 0.15;

/** Player direction line length factor */
export const DIRECTION_LINE_LENGTH = 0.8;
