/**
 * =============================================================================
 * FLIPBOARD 3D GALLERY - CONFIGURATION AND CONSTANTS
 * =============================================================================
 * 
 * This file contains all configuration values for the 3D raycaster gallery.
 * Centralized configuration makes it easy to adjust game behavior, performance,
 * and visual settings without hunting through multiple files.
 * 
 * Key Areas:
 * - Gameplay constants (movement, interaction, timing)
 * - Rendering settings (FPS, smoothing, dimensions)
 * - Raycasting parameters (step size, max distance)
 * - Canvas dimensions and scaling
 * - Player spawn position and minimap settings
 * 
 * Author: Flipboard Project Team
 * Last Updated: 2024
 * =============================================================================
 */

// =============================================================================
// GAMEPLAY CONSTANTS
// =============================================================================

/** Distance threshold for triggering gallery paintings (in world units) */
export const TRIGGER_DISTANCE = 1.0;

/** Cooldown time between gallery triggers to prevent spam (milliseconds) */
export const TRIGGER_COOLDOWN = 7000;

/** Precision threshold for looking at paintings (radians) - how accurate you need to aim */
export const LOOK_PRECISION = 0.05;

/** Player movement speed (units per frame at 15fps) - calibrated for smooth movement */
export const MOVE_SPEED = 2.2 / 15;

/** Player rotation speed (radians per frame at 15fps) - how fast you can turn */
export const ROTATION_SPEED = 1.8 / 15;

/** Field of view in radians (60 degrees) - how wide your view is */
export const FOV = Math.PI / 3;

// =============================================================================
// RENDERING CONSTANTS
// =============================================================================

/** Smoothing factor for depth and size buffers (0-1) - higher = smoother but less responsive */
export const SMOOTH_FACTOR = 0.7;

/** Width of pillar rendering in pixels - affects wall thickness in 3D view */
export const PILLAR_THICKNESS = 2;

/** Width of gallery frame rendering in pixels - affects painting frame thickness */
export const FRAME_THICKNESS = 3;

/** Target frame rate for consistent gameplay - lower FPS for retro feel */
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
