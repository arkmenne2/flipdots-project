// index.js
import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import "./preview.js";

const IS_DEV = process.argv.includes("--dev");

// Display
const display = new Display({
  layout: LAYOUT,
  panelWidth: 28,
  isMirrored: true,
  transport: !IS_DEV
    ? { type: "serial", path: "/dev/ttyACM0", baudRate: 57600 }
    : { type: "ip", host: "127.0.0.1", port: 3000 },
});

const { width, height } = display;

// IO
const outputDir = "./output";
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Fonts
registerFont(path.resolve(import.meta.dirname, "../fonts/OpenSans-Variable.ttf"), { family: "OpenSans" });
registerFont(path.resolve(import.meta.dirname, "../fonts/PPNeueMontrealMono-Regular.ttf"), { family: "PPNeueMontreal" });
registerFont(path.resolve(import.meta.dirname, "../fonts/Px437_ACM_VGA.ttf"), { family: "Px437_ACM_VGA" });

// Canvas
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
ctx.font = '18px monospace';
ctx.textBaseline = "top";

/* =========================
   SLOT CONFIG tuned for 82×28 @ 15 FPS
========================= */
const ROWS = 4;
const COLS = 3;
const SYMBOLS = ["bigdot", "smalldot", "plus", "minus"];

const MARGIN = 2;
const GRID_TOP = 2;
const GRID_BOTTOM = height - MARGIN;
const GRID_LEFT = MARGIN;
const GRID_RIGHT = width - MARGIN;
const GRID_W = GRID_RIGHT - GRID_LEFT;
const GRID_H = GRID_BOTTOM - GRID_TOP;

const CELL_W = Math.floor(GRID_W / COLS);            // about 26 px
const CELL_H = Math.floor(GRID_H / ROWS);            // about 6 px
const PLAY_W = CELL_W * COLS;
const PLAY_H = CELL_H * ROWS;
const PLAY_X = GRID_LEFT + Math.floor((GRID_W - PLAY_W) / 2);
const PLAY_Y = GRID_TOP + Math.floor((GRID_H - PLAY_H) / 2);

// Reels hold visible rows plus a tail for scrolling
const columnBuffers = Array.from({ length: COLS }, () =>
  Array.from({ length: ROWS + 2 }, () => randSymbol())
);

// Reel motion is pixel based for smoothness on low FPS
const reels = Array.from({ length: COLS }, () => ({
  spinning: false,
  offset: 0,     // 0..CELL_H
  speed: 0,      // px/s
  decelAt: 0,    // ms
  decel: false,
  snap: false,   // move at slow speed until crossing next cell boundary, then stop
}));

// Motion constants chosen for 15 FPS and 6 px cell height
const FAST_SPEED = CELL_H * 8;   // px/s -> about 8 rows per second
const SLOW_SPEED = CELL_H * 3;   // px/s -> readable slow before stop
const DECEL_RATE = CELL_H * 30;  // px/s² to reach SLOW in ~0.2..0.3 s

// Spin lifecycle
let spinActive = false;
let decelTimes = [0, 0, 0];
let lastElapsed = 0;

// Wins
let winningLines = [];
let blinkStart = 0;
let showWinsUntil = 0;

// Paylines: 4 horizontals + 2 rising + 2 falling
const paylines = [
  ...Array.from({ length: ROWS }, (_, r) => [[r, 0], [r, 1], [r, 2]]),
  [[0,0],[1,1],[2,2]],
  [[1,0],[2,1],[3,2]],
  [[3,0],[2,1],[1,2]],
  [[2,0],[1,1],[0,2]],
];

/* =========================
   HELPERS
========================= */
function randSymbol() {
  return SYMBOLS[(Math.random() * SYMBOLS.length) | 0];
}

function shiftUp(col) {
  // window moves up by one row
  columnBuffers[col].push(randSymbol());
  columnBuffers[col].shift();
}

function currentGrid() {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill("bigdot"));
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) grid[r][c] = columnBuffers[c][r];
  }
  return grid;
}

function evaluateWins() {
  const g = currentGrid();
  const wins = [];
  for (const line of paylines) {
    const [a, b, d] = line;
    const s1 = g[a[0]][a[1]];
    const s2 = g[b[0]][b[1]];
    const s3 = g[d[0]][d[1]];
    if (s1 === s2 && s2 === s3) wins.push(line);
  }
  return wins;
}

// Button command from preview
let pendingSpin = false;
function pollSpinCommand() {
  try {
    const cmdPath = path.join(outputDir, "cmd.json");
    if (fs.existsSync(cmdPath)) {
      fs.unlinkSync(cmdPath);
      pendingSpin = true;
    }
  } catch {}
}

/* =========================
   SPIN CONTROL
========================= */
function tryStartSpin(now) {
  if (spinActive || reels.some(r => r.spinning)) return;

  winningLines = [];
  showWinsUntil = 0;
  blinkStart = now;

  spinActive = true;

  for (let c = 0; c < COLS; c++) {
    const r = reels[c];
    r.spinning = true;
    r.offset = 0;
    r.speed = FAST_SPEED;
    r.decel = false;
    r.snap = false;
  }

  // staggered decel left to right
  decelTimes = [now + 900, now + 1300, now + 1700];
}

function updateReel(c, dt, now) {
  const r = reels[c];

  if (!r.spinning) return;

  // schedule decel
  if (!r.decel && now >= decelTimes[c]) {
    r.decel = true;
  }

  // ease speed toward SLOW before snap
  if (r.decel && !r.snap) {
    r.speed = Math.max(SLOW_SPEED, r.speed - DECEL_RATE * dt);
    if (r.speed <= SLOW_SPEED + 0.01) {
      r.speed = SLOW_SPEED;
      r.snap = true;    // ready to stop on next cell boundary
      r.decel = false;
    }
  }

  // advance offset
  const prev = r.offset;
  r.offset += r.speed * dt;

  // perform row shifts
  while (r.offset >= CELL_H) {
    r.offset -= CELL_H;
    shiftUp(c);

    if (r.snap) {
      // crossed a boundary while in snap mode -> stop aligned
      r.offset = 0;
      r.speed = 0;
      r.spinning = false;
      r.snap = false;
      break;
    }
  }
}

function finishIfAllStopped(now) {
  if (!spinActive) return;
  if (reels.some(r => r.spinning)) return;

  spinActive = false;
  winningLines = evaluateWins();
  blinkStart = now;
  showWinsUntil = now + 1800;
}

/* =========================
   DRAW
========================= */
function drawGrid() {
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(PLAY_X - 1, PLAY_Y - 1, PLAY_W + 2, PLAY_H + 2);

  ctx.lineWidth = 1;
  for (let c = 1; c < COLS; c++) {
    const x = PLAY_X + c * CELL_W + 0.5;
    ctx.beginPath(); ctx.moveTo(x, PLAY_Y); ctx.lineTo(x, PLAY_Y + PLAY_H); ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    const y = PLAY_Y + r * CELL_H + 0.5;
    ctx.beginPath(); ctx.moveTo(PLAY_X, y); ctx.lineTo(PLAY_X + PLAY_W, y); ctx.stroke();
  }
}

// symbols sized for low height cells
function drawSymbol(type, cx, cy) {
  const bigR = Math.max(2, Math.floor(CELL_H * 0.25));  
  const smallR = Math.max(1, Math.floor(CELL_H * 0.10)); 
  const bar = Math.max(1, Math.floor(CELL_H * 0.20));   
  const len = Math.max(2, Math.floor(CELL_H * 0.4));     

  if (type === "bigdot") {
    ctx.beginPath(); ctx.arc(cx, cy, bigR, 0, Math.PI * 2); ctx.fill(); return;
  }
  if (type === "smalldot") {
    ctx.beginPath(); ctx.arc(cx, cy, smallR, 0, Math.PI * 2); ctx.fill(); return;
  }
  if (type === "plus") {
    ctx.fillRect(cx - Math.floor(bar / 2), cy - len, bar, len * 2 + 1);
    ctx.fillRect(cx - len, cy - Math.floor(bar / 2), len * 2 + 1, bar);
    return;
  }
  if (type === "minus") {
    ctx.fillRect(cx - len, cy - Math.floor(bar / 2), len * 2 + 1, bar);
    return;
  }
}

function drawReels() {
  ctx.fillStyle = "#fff";
  for (let c = 0; c < COLS; c++) {
    // draw rows plus one extra bottom row for scrolling
    for (let r = 0; r <= ROWS; r++) {
      const idx = Math.min(r, ROWS); // last index is the extra tail
      const sym = columnBuffers[c][idx];
      const x = PLAY_X + c * CELL_W;
      const yTop = PLAY_Y + r * CELL_H - reels[c].offset; // motion is up
      const cx = x + Math.floor(CELL_W / 2);
      const cy = yTop + Math.floor(CELL_H / 2);
      drawSymbol(sym, cx, cy);
    }
  }
}

function drawWinningLines(now) {
  if (!winningLines.length) return;
  if (showWinsUntil && now > showWinsUntil) return;

  // gentle blink for low FPS
  const blinkOn = Math.floor((now - blinkStart) / 250) % 2 === 0;

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = blinkOn ? 2 : 1;

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

    if (blinkOn) {
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 1.8, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }
    }
  }
}

/* =========================
   LOOP
========================= */
const ticker = new Ticker({ fps: FPS });

ticker.start(({ deltaTime, elapsedTime }) => {
  // dt in seconds from last frame
  const dt = (elapsedTime - lastElapsed) / 1000 || (1 / FPS);
  lastElapsed = elapsedTime;

  // input
  pollSpinCommand();
  if (pendingSpin) {
    tryStartSpin(elapsedTime);
    pendingSpin = false;
  }

  // update reels
  for (let c = 0; c < COLS; c++) updateReel(c, dt, elapsedTime);
  finishIfAllStopped(elapsedTime);

  // draw
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  drawGrid();
  drawReels();
  drawWinningLines(elapsedTime);

  // binary threshold
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const binary = brightness > 127 ? 255 : 0;
    data[i] = binary; data[i + 1] = binary; data[i + 2] = binary; data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  if (IS_DEV) {
    fs.writeFileSync(path.join(outputDir, "frame.png"), canvas.toBuffer("image/png"));
  } else {
    const img = ctx.getImageData(0, 0, display.width, display.height);
    display.setImageData(img);
    if (display.isDirty()) display.flush();
  }
});
