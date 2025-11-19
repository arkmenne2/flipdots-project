/**
 * Server-side Player State Management
 * No browser input - controlled via API or automatic movement
 */

import { isWall } from "../js/world.js";
import {
  MOVE_SPEED,
  ROTATION_SPEED,
  SPAWN_X,
  SPAWN_Y,
  SPAWN_ANGLE,
  AUTO_MODE_DEFAULT,
} from "./settings";

interface PlayerState {
  x: number;
  y: number;
  angle: number;
}

interface PlayerInput {
  forward: number;
  strafe: number;
  turn: number;
}

// Player state
let px = SPAWN_X;
let py = SPAWN_Y;
let pa = SPAWN_ANGLE;

// Current input state
let currentInput: PlayerInput = { forward: 0, strafe: 0, turn: 0 };

// Automatic movement mode (demo mode) - configurable via env
let autoMode = AUTO_MODE_DEFAULT;
let autoMoveTimer = 0;

/**
 * Set player input (called from API)
 */
export function setPlayerInput(input: PlayerInput) {
  currentInput = input;
  autoMode = false;
}

/**
 * Enable automatic demo movement
 */
export function enableAutoMode() {
  autoMode = true;
}

export function disableAutoMode() {
  autoMode = false;
}

/**
 * Update player state based on input or automatic movement
 */
export function updatePlayer(dt: number) {
  if (autoMode) {
    // Automatic demo movement
    autoMoveTimer += dt;
    
    // Simple patrol pattern
    const cycle = Math.floor(autoMoveTimer / 120) % 4;
    switch (cycle) {
      case 0:
        currentInput = { forward: 1, strafe: 0, turn: 0 };
        break;
      case 1:
        currentInput = { forward: 0, strafe: 0, turn: 1 };
        break;
      case 2:
        currentInput = { forward: 1, strafe: 0, turn: 0 };
        break;
      case 3:
        currentInput = { forward: 0, strafe: 0, turn: -1 };
        break;
    }
  }
  
  // Update rotation
  if (currentInput.turn !== 0) {
    pa += currentInput.turn * ROTATION_SPEED * dt;
  }
  
  // Update position
  if (currentInput.forward !== 0 || currentInput.strafe !== 0) {
    const dx = Math.cos(pa);
    const dy = Math.sin(pa);
    const mx = (dx * currentInput.forward + Math.cos(pa + Math.PI / 2) * currentInput.strafe) * MOVE_SPEED * dt;
    const my = (dy * currentInput.forward + Math.sin(pa + Math.PI / 2) * currentInput.strafe) * MOVE_SPEED * dt;
    
    const nx = px + mx;
    const ny = py + my;
    
    if (!isWall(nx, py)) {
      px = nx;
    }
    if (!isWall(px, ny)) {
      py = ny;
    }
  }
  
  // Reset input after processing (for API calls)
  if (!autoMode) {
    currentInput = { forward: 0, strafe: 0, turn: 0 };
  }
}

/**
 * Get current player state
 */
export function getPlayerState(): PlayerState {
  return { x: px, y: py, angle: pa };
}

/**
 * Reset player to spawn position
 */
export function resetPlayer() {
  px = SPAWN_X;
  py = SPAWN_Y;
  pa = SPAWN_ANGLE;
}

