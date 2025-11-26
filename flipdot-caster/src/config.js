import 'dotenv/config';

const defaultRoomUrl =
  process.env.ROOM_URL ?? 'https://flipdots-project.vercel.app/';

const viewport = {
  width: Number(process.env.VIEWPORT_WIDTH ?? 1200),
  height: Number(process.env.VIEWPORT_HEIGHT ?? 650)
};

const captureSelector = process.env.CAPTURE_SELECTOR ?? '#v';

const defaultFrameRate = Number(process.env.FRAME_RATE ?? 15);
const defaultFrameDelay = Number(
  process.env.FRAME_DELAY_MS ?? Math.round(1000 / defaultFrameRate)
);

export const captureConfig = {
  roomUrl: defaultRoomUrl,
  viewport,
  selector: captureSelector,
  frames: Number(process.env.FRAMES ?? 8),
  frameDelayMs: defaultFrameDelay
};

export const boardConfig = {
  width: Number(process.env.FLIPDOT_WIDTH ?? 84),
  height: Number(process.env.FLIPDOT_HEIGHT ?? 28),
  threshold: Number(process.env.FLIPDOT_THRESHOLD ?? 128),
  transport: process.env.FLIPDOT_TRANSPORT ?? 'tcp'
};

export const transportConfig = {
  tcp: {
    host: process.env.FLIPDOT_TCP_HOST ?? '192.168.1.50',
    port: Number(process.env.FLIPDOT_TCP_PORT ?? 9999)
  },
  http: {
    url: process.env.FLIPDOT_HTTP_URL ?? 'http://localhost:8080/frame'
  }
};

export const liveConfig = {
  roomUrl: process.env.LIVE_ROOM_URL ?? defaultRoomUrl,
  viewport,
  selector: captureSelector,
  frameRate: defaultFrameRate,
  outputDir: process.env.FRAME_OUTPUT_DIR ?? 'frames/live',
  retainFrames: Number(process.env.FRAME_RETAIN_COUNT ?? 450)
};

