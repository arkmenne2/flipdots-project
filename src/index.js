// index.js
import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import "./preview.js";

const IS_DEV = process.argv.includes("--dev");

// Create display
const display = new Display({
  layout: LAYOUT,
  panelWidth: 28,
  isMirrored: true,
  transport: !IS_DEV
    ? { type: "serial", path: "/dev/ttyACM0", baudRate: 57600 }
    : { type: "ip", host: "127.0.0.1", port: 3000 },
});

const { width, height } = display;

// Output dir
const outputDir = "./output";
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Fonts
registerFont(
  path.resolve(import.meta.dirname, "../fonts/OpenSans-Variable.ttf"),
  { family: "OpenSans" },
);
registerFont(
  path.resolve(import.meta.dirname, "../fonts/PPNeueMontrealMono-Regular.ttf"),
  { family: "PPNeueMontreal" },
);
registerFont(path.resolve(import.meta.dirname, "../fonts/Px437_ACM_VGA.ttf"), {
  family: "Px437_ACM_VGA",
});

// Canvas
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
ctx.font = '18px monospace';
ctx.textBaseline = "top";

// ---- SLOT MACHINE STATE ----
const ROWS = 4;
const COLS = 3;
const SYMBOLS = ["circle", "star"];

const UI_TOP = 0;         // no timer row
const MARGIN = 2;
const GRID_TOP = UI_TOP + 2;
const GRID_BOTTOM = height - MARGIN;
const GRID_LEFT = MARGIN;
const GRID_RIGHT = width - MARGIN;
const GRID_W = GRID_RIGHT - GRID_LEFT;
const GRID_H = GRID_BOTTOM - GRID_TOP;

const CELL_W = Math.floor(GRID_W / COLS);
const CELL_H = Math.floor(GRID_H / ROWS);
const PLAY_W = CELL_W * COLS;
const PLAY_H = CELL_H * ROWS;
const PLAY_X = GRID_LEFT + Math.floor((GRID_W - PLAY_W) / 2);
const PLAY_Y = GRID_TOP + Math.floor((GRID_H - PLAY_H) / 2);

// columns as ring buffers for smooth spin
const columnBuffers = Array.from({ length: COLS }, () =>
  Array.from({ length: ROWS + 3 }, () => randSymbol())
);

let spinning = [false, false, false];
let lastStepAt = [0, 0, 0];
let stepInterval = [40, 40, 40];
let stopTimes = [0, 0, 0];
let allStoppedAt = 0;
let showWinsUntil = 0;

const paylines = [
  // horizontals
  ...Array.from({ length: ROWS }, (_, r) => [[r, 0], [r, 1], [r, 2]]),
  // diagonals slope +1
  ...[0, 1].map(r => [[r, 0], [r + 1, 1], [r + 2, 2]]),
  // diagonals slope -1
  ...[3, 2].map(r => [[r, 0], [r - 1, 1], [r - 2, 2]]),
];

let winningLines = [];
let winBlinkStart = 0;

// ---- INPUT: SPACE TO SPIN ----
function bindKeyboard() {
  if (!process.stdin.isTTY) {
    console.log("Tip: run in a terminal to use Space to spin.");
    return;
  }
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (key) => {
    if (key === " ") {
      tryStartSpin(performance.now());
    }
    if (key === "\u0003") process.exit(); // Ctrl+C
  });
}

function randSymbol() {
  return SYMBOLS[(Math.random() * SYMBOLS.length) | 0];
}

function tryStartSpin(now) {
  // if already spinning, ignore
  if (spinning.some(Boolean)) return;
  // if showing wins, restart right away
  showWinsUntil = 0;
  startSpin(now);
}

function startSpin(now) {
  spinning = [true, true, true];
  stepInterval = [40, 40, 40];
  stopTimes = [now + 1200, now + 1700, now + 2200];
  lastStepAt = [now, now, now];
  winningLines = [];
  winBlinkStart = now;
  allStoppedAt = 0;
}

function maybeStopColumns(now) {
  for (let c = 0; c < COLS; c++) {
    if (spinning[c] && now >= stopTimes[c]) {
      stepInterval[c] = 120; // brief slow step before stop
      if (now - lastStepAt[c] >= stepInterval[c]) {
        spinOneStep(c);
        spinning[c] = false;
        lastStepAt[c] = now;
      }
    }
  }
  if (spinning.every(s => s === false) && allStoppedAt === 0) {
    allStoppedAt = now;
    winningLines = evaluateWins();
    winBlinkStart = now;
    showWinsUntil = now + 1500;
  }
}

function spinOneStep(col) {
  columnBuffers[col].unshift(randSymbol());
  columnBuffers[col].pop();
}

function tickSpin(now) {
  for (let c = 0; c < COLS; c++) {
    if (!spinning[c]) continue;
    if (now - lastStepAt[c] >= stepInterval[c]) {
      spinOneStep(c);
      lastStepAt[c] = now;
      stepInterval[c] = Math.min(90, stepInterval[c] + 1);
    }
  }
}

function currentGrid() {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill("circle"));
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) grid[r][c] = columnBuffers[c][r];
  }
  return grid;
}

function evaluateWins() {
  const grid = currentGrid();
  const wins = [];
  for (const line of paylines) {
    const [a, b, d] = line;
    const s1 = grid[a[0]][a[1]];
    const s2 = grid[b[0]][b[1]];
    const s3 = grid[d[0]][d[1]];
    if (s1 === s2 && s2 === s3) wins.push(line);
  }
  return wins;
}

// draw helpers
function drawGrid() {
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;

  // outer frame
  ctx.strokeRect(PLAY_X - 1, PLAY_Y - 1, PLAY_W + 2, PLAY_H + 2);

  // inner cell lines
  for (let c = 1; c < COLS; c++) {
    const x = PLAY_X + c * CELL_W + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, PLAY_Y);
    ctx.lineTo(x, PLAY_Y + PLAY_H);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    const y = PLAY_Y + r * CELL_H + 0.5;
    ctx.beginPath();
    ctx.moveTo(PLAY_X, y);
    ctx.lineTo(PLAY_X + PLAY_W, y);
    ctx.stroke();
  }
}

function drawSymbol(type, cx, cy, size) {
  if (type === "circle") {
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (type === "star") {
    const spikes = 5;
    const outer = size;
    const inner = Math.max(1, size * 0.5);
    let rot = -Math.PI / 2;
    const step = Math.PI / spikes;
    ctx.beginPath();
    for (let i = 0; i < spikes; i++) {
      const x1 = cx + Math.cos(rot) * outer;
      const y1 = cy + Math.sin(rot) * outer;
      ctx.lineTo(x1, y1);
      rot += step;

      const x2 = cx + Math.cos(rot) * inner;
      const y2 = cy + Math.sin(rot) * inner;
      ctx.lineTo(x2, y2);
      rot += step;
    }
    ctx.closePath();
    ctx.fill();
  }
}

function drawReels() {
  const grid = currentGrid();
  ctx.fillStyle = "#fff";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = PLAY_X + c * CELL_W;
      const y = PLAY_Y + r * CELL_H;
      const cx = x + Math.floor(CELL_W / 2);
      const cy = y + Math.floor(CELL_H / 2);
      const size = Math.floor(Math.min(CELL_W, CELL_H) * 0.35);
      drawSymbol(grid[r][c], cx, cy, size);
    }
  }
}

function drawWinningLines(now) {
  if (!winningLines.length) return;
  if (showWinsUntil && now > showWinsUntil) return;
  const on = Math.floor((now - winBlinkStart) / 200) % 2 === 0;
  if (!on) return;

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;

  for (const line of winningLines) {
    const pts = line.map(([r, c]) => {
      const x = PLAY_X + c * CELL_W + Math.floor(CELL_W / 2);
      const y = PLAY_Y + r * CELL_H + Math.floor(CELL_H / 2);
      return [x, y];
    });
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.stroke();
  }
}

// ---- RENDER LOOP ----
const ticker = new Ticker({ fps: FPS });

bindKeyboard(); // enable Space to spin

ticker.start(({ deltaTime, elapsedTime }) => {
  console.clear();
  console.time("Write frame");
  console.log(`Rendering a ${width}x${height} canvas`);
  console.log("View at http://localhost:3000/view");
  console.log("Press Space in this terminal to spin. Ctrl+C to exit.");

  // background
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  // spin state
  if (spinning.some(Boolean)) {
    tickSpin(elapsedTime);
    maybeStopColumns(elapsedTime);
  }

  // draw slot
  drawGrid();
  drawReels();
  drawWinningLines(elapsedTime);

  // Convert to pure black and white
  {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const binary = brightness > 127 ? 255 : 0;
      data[i] = binary;
      data[i + 1] = binary;
      data[i + 2] = binary;
      data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  if (IS_DEV) {
    const filename = path.join(outputDir, "frame.png");
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(filename, buffer);
  } else {
    const imageData = ctx.getImageData(0, 0, display.width, display.height);
    display.setImageData(imageData);
    if (display.isDirty()) display.flush();
  }

  console.timeEnd("Write frame");
});
