import {
  TRIGGER_DISTANCE as CLIENT_TRIGGER_DISTANCE,
  TRIGGER_COOLDOWN as CLIENT_TRIGGER_COOLDOWN,
  LOOK_PRECISION as CLIENT_LOOK_PRECISION,
  MOVE_SPEED as CLIENT_MOVE_SPEED,
  ROTATION_SPEED as CLIENT_ROTATION_SPEED,
  SPAWN_X as CLIENT_SPAWN_X,
  SPAWN_Y as CLIENT_SPAWN_Y,
  SPAWN_ANGLE as CLIENT_SPAWN_ANGLE,
  TARGET_FPS as CLIENT_TARGET_FPS,
} from "../js/config.js";

const boolFromEnv = (key: string, fallback: boolean) => {
  const value = process.env[key];
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
};

const numberFromEnv = (key: string, fallback: number) => {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const stringFromEnv = (key: string, fallback: string) => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};

export const IS_DEV_RUNTIME =
  process.argv.includes("--dev") || process.env.NODE_ENV === "development";

export const FPS = numberFromEnv("FPS", CLIENT_TARGET_FPS ?? 15);

export const LAYOUT = [
  [3, 2, 1],
  [4, 5, 6],
  [9, 8, 7],
  [10, 11, 12],
];

const DEFAULT_DISPLAY_MODE = IS_DEV_RUNTIME ? "emu" : "flipdot";

export type DisplayMode = "flipdot" | "led" | "emu" | "stdout" | "off";

export const DISPLAY_MODES: DisplayMode[] = stringFromEnv(
  "DISPLAY_MODE",
  DEFAULT_DISPLAY_MODE
)
  .split(",")
  .map((mode) => mode.trim().toLowerCase())
  .filter((mode) => mode.length > 0)
  .map((mode) => {
    if (["flipdot", "led", "emu", "stdout", "off"].includes(mode)) {
      return mode as DisplayMode;
    }
    console.warn(
      `⚠️  Unknown DISPLAY_MODE "${mode}", falling back to "off" for this entry.`
    );
    return "off";
  });

export const DISPLAY_PANEL_WIDTH = numberFromEnv("DISPLAY_PANEL_WIDTH", 28);
export const DISPLAY_IS_MIRRORED = boolFromEnv("DISPLAY_MIRRORED", true);
export const FLIPDOT_SERIAL_PATH = stringFromEnv(
  "FLIPDOT_SERIAL_PATH",
  process.platform === "win32" ? "COM3" : "/dev/ttyACM0"
);
export const FLIPDOT_BAUD_RATE = numberFromEnv("FLIPDOT_BAUD_RATE", 57600);
export const LED_HOST = stringFromEnv("LED_HOST", "127.0.0.1");
export const LED_PORT = numberFromEnv("LED_PORT", 7890);
export const GALLERY_REFRESH_INTERVAL_MS = numberFromEnv(
  "GALLERY_REFRESH_MS",
  15000
);
export const AUTO_MODE_DEFAULT = boolFromEnv("AUTO_DEMO", false);

export const MOVE_SPEED = numberFromEnv("MOVE_SPEED", CLIENT_MOVE_SPEED);
export const ROTATION_SPEED = numberFromEnv(
  "ROTATION_SPEED",
  CLIENT_ROTATION_SPEED
);
export const SPAWN_X = numberFromEnv("SPAWN_X", CLIENT_SPAWN_X);
export const SPAWN_Y = numberFromEnv("SPAWN_Y", CLIENT_SPAWN_Y);
export const SPAWN_ANGLE = numberFromEnv("SPAWN_ANGLE", CLIENT_SPAWN_ANGLE);

export const TRIGGER_DISTANCE = numberFromEnv(
  "TRIGGER_DISTANCE",
  CLIENT_TRIGGER_DISTANCE
);
export const TRIGGER_COOLDOWN = numberFromEnv(
  "TRIGGER_COOLDOWN",
  CLIENT_TRIGGER_COOLDOWN
);
export const LOOK_PRECISION = numberFromEnv(
  "LOOK_PRECISION",
  CLIENT_LOOK_PRECISION
);

