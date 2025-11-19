/**
 * =============================================================================
 * FLIPBOARD 3D GALLERY - BUN SERVER (Raspberry Pi)
 * =============================================================================
 * 
 * Server-side rendering for flipboard display using Bun runtime.
 * This server runs entirely on the Raspberry Pi without a browser.
 * 
 * Features:
 * - Server-side 3D raycasting engine
 * - Flipboard hardware integration via serial port
 * - API endpoints for Slack integration
 * - GitHub repository downloading and execution
 * - Binary black/white frame rendering
 * 
 * Usage:
 *   bun run server-bun.ts --dev    # Development mode (saves PNG frames)
 *   bun run server-bun.ts          # Production mode (sends to flipboard)
 * 
 * Author: Flipboard Project Team
 * Last Updated: 2024
 * =============================================================================
 */

// Dynamic imports for optional native modules
let Display: any;
let createCanvas: any;
let loadImage: any;

// Helper function to create a black PNG buffer (defined early for use in fallback)
function createBlackPNG(w: number, h: number): Buffer {
  // Create a minimal valid black PNG with correct dimensions
  const writeUInt32BE = (buffer: Buffer, value: number, offset: number) => {
    buffer[offset] = (value >>> 24) & 0xFF;
    buffer[offset + 1] = (value >>> 16) & 0xFF;
    buffer[offset + 2] = (value >>> 8) & 0xFF;
    buffer[offset + 3] = value & 0xFF;
  };
  
  // Calculate CRC32 (simplified)
  const crc32 = (data: Buffer): number => {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  };
  
  // Build PNG chunks
  const ihdrData = Buffer.allocUnsafe(13);
  writeUInt32BE(ihdrData, w, 0);
  writeUInt32BE(ihdrData, h, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 0;  // color type (grayscale)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrChunk = Buffer.concat([Buffer.from('IHDR'), ihdrData]);
  const ihdrCrc = Buffer.allocUnsafe(4);
  writeUInt32BE(ihdrCrc, crc32(ihdrChunk), 0);
  
  // Minimal IDAT data (1 black pixel, zlib compressed)
  const idatData = Buffer.from([0x78, 0x9C, 0x63, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01]);
  const idatChunk = Buffer.concat([Buffer.from('IDAT'), idatData]);
  const idatCrc = Buffer.allocUnsafe(4);
  writeUInt32BE(idatCrc, crc32(idatChunk), 0);
  
  // IEND chunk
  const iendChunk = Buffer.from('IEND');
  const iendCrc = Buffer.from([0xAE, 0x42, 0x60, 0x82]);
  
  // Assemble PNG
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG signature
    Buffer.from([0x00, 0x00, 0x00, 0x0D]), // IHDR length
    ihdrChunk,
    ihdrCrc,
    Buffer.from([0x00, 0x00, 0x00, idatData.length]), // IDAT length
    idatChunk,
    idatCrc,
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // IEND length
    iendChunk,
    iendCrc
  ]);
}

/**
 * Initialize native modules with fallbacks
 */
async function initializeModules() {
  // Try to load flipdot-emu package
  try {
    const flipdotModule = await import("@owowagency/flipdot-emu");
    Display = flipdotModule.Display;
    console.log("✅ Flipdot-emu package loaded");
  } catch (err: any) {
    console.warn("⚠️  @owowagency/flipdot-emu not available, using mock display");
    console.warn("   Error:", err.message);
    // Mock Display for development
    const fallbackWidth =
      Math.max(...LAYOUT.map((row) => row.length || 0)) * DISPLAY_PANEL_WIDTH;
    const fallbackHeight = LAYOUT.length * PANEL_HEIGHT;
    Display = class MockDisplay {
      width = fallbackWidth || 84;
      height = fallbackHeight || 28;
      constructor() {}
      setImageData() {}
      isDirty() { return false; }
      flush() {}
    };
  }

  // Try to load canvas package (with extra error handling)
  // Canvas import can fail during module resolution, so we need to be very careful
  let canvasLoadSuccess = false;
  let canvasErrorMsg = "Canvas module not found";
  
  try {
    // Try to import canvas - this might fail during module resolution
    const canvasImport: any = await import("canvas").catch((e: any) => {
      // Return a mock object so we can check if it's valid
      return { __error: true, __errorMsg: e?.message || "Unknown error" };
    });
    
    // Check if import actually succeeded (not an error object)
    if (canvasImport && !canvasImport.__error && canvasImport.createCanvas && canvasImport.loadImage) {
      try {
        // Test if canvas actually works by creating a small test canvas
        const testCanvas = canvasImport.createCanvas(1, 1);
        if (testCanvas && typeof testCanvas.getContext === 'function') {
          createCanvas = canvasImport.createCanvas;
          loadImage = canvasImport.loadImage;
          canvasLoadSuccess = true;
          console.log("✅ Canvas package loaded and working");
        } else {
          canvasErrorMsg = "Canvas created but getContext failed";
        }
      } catch (testErr: any) {
        canvasErrorMsg = `Canvas test failed: ${testErr.message}`;
        console.warn("⚠️  Canvas module exists but test failed:", testErr.message);
      }
    } else if (canvasImport && canvasImport.__error) {
      canvasErrorMsg = canvasImport.__errorMsg || "Canvas import error";
    }
  } catch (importErr: any) {
    // This catch should handle any synchronous errors during import
    canvasErrorMsg = importErr?.message || "Import exception";
    console.warn("⚠️  Canvas import failed:", canvasErrorMsg);
  }
  
  if (!canvasLoadSuccess) {
    // Canvas failed to load - use fallback
    console.warn("⚠️  Canvas package failed to load - using software rendering fallback");
    console.warn("   Error:", canvasErrorMsg);
    console.warn("   To enable full rendering, install canvas:");
    console.warn("   - Windows: Install Visual Studio Build Tools with C++ workload");
    console.warn("   - Then run: bun install canvas --force");
    console.warn("");
    console.warn("   Using software fallback canvas (will render frames)");
    
    // PNG encoder setup (needed before canvas creation)
    let encodePNG: (data: Uint8ClampedArray, w: number, h: number) => Buffer;
    try {
      // Try to load PNG encoder module
      const pngEncoderModule = await import("./src/png-encoder").catch(() => null);
      if (pngEncoderModule && pngEncoderModule.encodePNG) {
        encodePNG = pngEncoderModule.encodePNG;
        console.log("✅ PNG encoder loaded");
      } else {
        throw new Error("PNG encoder module not found");
      }
    } catch (err2: any) {
      console.warn("⚠️  PNG encoder failed, using simplified encoder:", err2.message);
      // Use a simple encoder that just creates black PNGs for now
      encodePNG = (data: Uint8ClampedArray, w: number, h: number) => {
        // Try to use zlib to create a proper PNG
        try {
          const zlib = require('zlib');
          // Create a simple RGB PNG
          const rowSize = w * 3;
          const imageBuffer = Buffer.allocUnsafe(h * (rowSize + 1));
          
          for (let y = 0; y < h; y++) {
            const rowOffset = y * (rowSize + 1);
            imageBuffer[rowOffset] = 0; // No filter
            for (let x = 0; x < w; x++) {
              const srcIdx = (y * w + x) * 4;
              const dstIdx = rowOffset + 1 + x * 3;
              imageBuffer[dstIdx] = data[srcIdx] || 0;
              imageBuffer[dstIdx + 1] = data[srcIdx + 1] || 0;
              imageBuffer[dstIdx + 2] = data[srcIdx + 2] || 0;
            }
          }
          
          const compressed = zlib.deflateSync(imageBuffer);
          
          // Build PNG structure
          const writeUInt32BE = (val: number) => {
            const buf = Buffer.allocUnsafe(4);
            buf.writeUInt32BE(val, 0);
            return buf;
          };
          
          const crc32 = (data: Buffer) => {
            let crc = 0xFFFFFFFF;
            const table: number[] = [];
            for (let i = 0; i < 256; i++) {
              let c = i;
              for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
              }
              table[i] = c;
            }
            for (let i = 0; i < data.length; i++) {
              crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
            }
            return (crc ^ 0xFFFFFFFF) >>> 0;
          };
          
          const ihdrData = Buffer.allocUnsafe(13);
          writeUInt32BE(w).copy(ihdrData, 0);
          writeUInt32BE(h).copy(ihdrData, 4);
          ihdrData[8] = 8; ihdrData[9] = 2; ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;
          
          const ihdrChunk = Buffer.concat([Buffer.from('IHDR'), ihdrData]);
          const idatChunk = Buffer.concat([Buffer.from('IDAT'), compressed]);
          const iendChunk = Buffer.from('IEND');
          
          return Buffer.concat([
            Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
            writeUInt32BE(13), ihdrChunk, writeUInt32BE(crc32(ihdrChunk)),
            writeUInt32BE(compressed.length), idatChunk, writeUInt32BE(crc32(idatChunk)),
            writeUInt32BE(0), iendChunk, Buffer.from([0xAE, 0x42, 0x60, 0x82])
          ]);
        } catch {
          // Ultimate fallback
          return createBlackPNG(w, h);
        }
      };
    }
    
      // Helper function to parse color strings (must handle rgb() format)
      const parseColor = (color: string): { r: number; g: number; b: number } => {
        if (!color || typeof color !== 'string') {
          return { r: 0, g: 0, b: 0 }; // Default to black
        }
        
        // Handle rgb(r, g, b) format
        if (color.startsWith('rgb(')) {
          try {
            const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
              return {
                r: parseInt(match[1]) || 0,
                g: parseInt(match[2]) || 0,
                b: parseInt(match[3]) || 0
              };
            }
          } catch (e) {
            // Fall through to default
          }
        }
        
        // Handle hex colors
        if (color.startsWith('#')) {
          try {
            const hex = color.slice(1);
            const num = parseInt(hex, 16);
            if (!isNaN(num)) {
              return {
                r: (num >> 16) & 0xFF,
                g: (num >> 8) & 0xFF,
                b: num & 0xFF
              };
            }
          } catch (e) {
            // Fall through to default
          }
        }
        
        // Named colors
        if (color === '#fff' || color === '#ffffff' || color === 'white' || color === '#FFFFFF') {
          return { r: 255, g: 255, b: 255 };
        }
        if (color === '#333' || color === '#333333') {
          return { r: 51, g: 51, b: 51 };
        }
        if (color === '#666' || color === '#666666') {
          return { r: 102, g: 102, b: 102 };
        }
        if (color === '#000' || color === '#000000' || color === 'black') {
          return { r: 0, g: 0, b: 0 };
        }
        
        // Default to black if we can't parse
        return { r: 0, g: 0, b: 0 };
      };
    
    // Full fallback - create a software canvas that can actually render
    createCanvas = (width: number, height: number) => {
      const imageData = new Uint8ClampedArray(width * height * 4);
      let currentFillStyle = "#000";
      let currentStrokeStyle = "#fff";
      
      const canvas: any = {
        width,
        height,
        getContext: (type: string) => {
          const ctx: any = {
            get fillStyle() { return currentFillStyle; },
            set fillStyle(value: string) { currentFillStyle = value; },
            get strokeStyle() { return currentStrokeStyle; },
            set strokeStyle(value: string) { currentStrokeStyle = value; },
            lineWidth: 1,
            fillRect: (x: number, y: number, w: number, h: number) => {
              const rgb = parseColor(currentFillStyle);
              for (let py = Math.max(0, y); py < Math.min(height, y + h); py++) {
                for (let px = Math.max(0, x); px < Math.min(width, x + w); px++) {
                  const i = (py * width + px) * 4;
                  imageData[i] = rgb.r;
                  imageData[i + 1] = rgb.g;
                  imageData[i + 2] = rgb.b;
                  imageData[i + 3] = 255;
                }
              }
            },
            strokeRect: (x: number, y: number, w: number, h: number) => {
              const rgb = parseColor(currentStrokeStyle);
              // Draw border
              for (let py = Math.max(0, y); py < Math.min(height, y + h); py++) {
                for (let px of [x, x + w - 1]) {
                  if (px >= 0 && px < width) {
                    const i = (py * width + px) * 4;
                    imageData[i] = rgb.r;
                    imageData[i + 1] = rgb.g;
                    imageData[i + 2] = rgb.b;
                    imageData[i + 3] = 255;
                  }
                }
              }
              for (let px = Math.max(0, x); px < Math.min(width, x + w); px++) {
                for (let py of [y, y + h - 1]) {
                  if (py >= 0 && py < height) {
                    const i = (py * width + px) * 4;
                    imageData[i] = rgb.r;
                    imageData[i + 1] = rgb.g;
                    imageData[i + 2] = rgb.b;
                    imageData[i + 3] = 255;
                  }
                }
              }
            },
            fill: () => {},
            stroke: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            arc: () => {},
            closePath: () => {},
            getImageData: (x: number, y: number, w: number, h: number) => {
              // Ensure bounds are valid
              const x0 = Math.max(0, Math.min(x, width));
              const y0 = Math.max(0, Math.min(y, height));
              const w0 = Math.min(w, width - x0);
              const h0 = Math.min(h, height - y0);
              
              const slice = new Uint8ClampedArray(w * h * 4);
              // Initialize to black/transparent
              for (let i = 0; i < slice.length; i += 4) {
                slice[i] = 0;
                slice[i + 1] = 0;
                slice[i + 2] = 0;
                slice[i + 3] = 255;
              }
              
              // Copy from imageData
              for (let py = 0; py < h0; py++) {
                for (let px = 0; px < w0; px++) {
                  const srcIdx = ((y0 + py) * width + (x0 + px)) * 4;
                  const dstIdx = (py * w + px) * 4;
                  if (srcIdx >= 0 && srcIdx < imageData.length - 3 && dstIdx < slice.length - 3) {
                    slice[dstIdx] = imageData[srcIdx];
                    slice[dstIdx + 1] = imageData[srcIdx + 1];
                    slice[dstIdx + 2] = imageData[srcIdx + 2];
                    slice[dstIdx + 3] = imageData[srcIdx + 3];
                  }
                }
              }
              
              // Return ImageData-like object
              return {
                data: slice,
                width: w,
                height: h
              } as ImageData;
            },
            putImageData: (imgData: any, x: number, y: number) => {
              for (let py = 0; py < imgData.height; py++) {
                for (let px = 0; px < imgData.width; px++) {
                  const srcIdx = (py * imgData.width + px) * 4;
                  const dstIdx = ((y + py) * width + (x + px)) * 4;
                  if (dstIdx >= 0 && dstIdx < imageData.length - 3) {
                    imageData[dstIdx] = imgData.data[srcIdx];
                    imageData[dstIdx + 1] = imgData.data[srcIdx + 1];
                    imageData[dstIdx + 2] = imgData.data[srcIdx + 2];
                    imageData[dstIdx + 3] = imgData.data[srcIdx + 3];
                  }
                }
              }
            },
          };
          return ctx;
        },
        toBuffer: (format: string) => {
          // Convert imageData to PNG using encoder
          return encodePNG(imageData, width, height);
        },
      };
      return canvas;
    };
    
    loadImage = async () => null;
  }
}

// Import other modules (these should not fail)
import { Ticker } from "./src/ticker";
import {
  FPS,
  LAYOUT,
  DISPLAY_MODES,
  DISPLAY_PANEL_WIDTH,
  DISPLAY_IS_MIRRORED,
  FLIPDOT_SERIAL_PATH,
  FLIPDOT_BAUD_RATE,
  LED_HOST,
  LED_PORT,
  GALLERY_REFRESH_INTERVAL_MS,
  IS_DEV_RUNTIME,
  AUTO_MODE_DEFAULT,
} from "./src/settings";
import { renderRoom } from "./src/room-renderer";
import {
  updatePlayer,
  getPlayerState,
  setPlayerInput,
} from "./src/player-server";
import { loadGalleryData, getGalleryFrames } from "./src/gallery-server";
import { downloadRepo } from "./src/download-handler";
import { processGalleryInteractions } from "./src/interactions";
import express, { Request, Response } from "express";
import { readFileSync, existsSync, watch } from "fs";
import { join } from "path";

const PANEL_HEIGHT = 7;

// Main initialization function
async function main() {
  try {
    // Initialize modules
    await initializeModules();
  } catch (err: any) {
    console.error("❌ Failed to initialize modules:", err.message);
    console.error("   Stack:", err.stack);
    // Continue anyway - fallbacks should handle it
    if (!createCanvas) {
      console.error("   Creating emergency fallback canvas");
      // Emergency fallback
      createCanvas = (w: number, h: number) => {
        const canvas: any = {
          width: w,
          height: h,
          getContext: () => ({
            fillStyle: "#000",
            fillRect: () => {},
            getImageData: () => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
            putImageData: () => {},
          }),
          toBuffer: () => createBlackPNG(w, h),
        };
        return canvas;
      };
      loadImage = async () => null;
    }
  }

  // =============================================================================
  // FLIPBOARD DISPLAY SETUP
  // =============================================================================

  const resolvedModes =
    DISPLAY_MODES.length > 0
      ? DISPLAY_MODES
      : [IS_DEV_RUNTIME ? "emu" : "flipdot"];

  const activeDisplays: Array<{
    id: string;
    mode: string;
    instance: any;
  }> = [];

  resolvedModes.forEach((mode, index) => {
    if (!mode || mode === "off") {
      return;
    }

    let transport: any = null;
    switch (mode) {
      case "flipdot":
        transport = {
          type: "serial",
          path: FLIPDOT_SERIAL_PATH,
          baudRate: FLIPDOT_BAUD_RATE,
        };
        break;
      case "led":
        transport = {
          type: "ip",
          host: LED_HOST,
          port: LED_PORT,
        };
        break;
      case "emu":
        transport = {
          type: "ip",
          host: "127.0.0.1",
          port: 3000,
        };
        break;
      case "stdout":
        transport = {
          type: "stdout",
        };
        break;
      default:
        console.warn(
          `⚠️  Unsupported display mode "${mode}" - skipping hardware target`
        );
        return;
    }

    try {
      const instance = new Display({
        layout: LAYOUT,
        panelWidth: DISPLAY_PANEL_WIDTH,
        isMirrored: DISPLAY_IS_MIRRORED,
        transport,
      });
      activeDisplays.push({
        id: `${mode}-${index}`,
        mode,
        instance,
      });
      console.log(
        `🟢 Display target ready [${mode}] ${JSON.stringify(transport)}`
      );
    } catch (err: any) {
      console.error(
        `❌ Failed to initialize display mode "${mode}":`,
        err?.message || err
      );
    }
  });

  if (activeDisplays.length === 0) {
    console.warn(
      "⚠️  No hardware display targets initialised - frames will be served via API only."
    );
  }

  const computedWidth =
    Math.max(...LAYOUT.map((row) => row.length)) * DISPLAY_PANEL_WIDTH;
  const computedHeight = LAYOUT.length * PANEL_HEIGHT;

  const { width, height } = activeDisplays[0]?.instance ?? {
    width: computedWidth,
    height: computedHeight,
  };

  if (activeDisplays.length > 0) {
    console.log(
      `🛠️  Active display modes: ${activeDisplays
        .map((d) => d.mode)
        .join(", ")}`
    );
  } else {
    console.log("🛠️  Active display modes: none (API only)");
  }

  // Create output directory only if needed (for manual saves)
  const outputDir = "./flipboard-output";

  // =============================================================================
  // CANVAS SETUP
  // =============================================================================

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // =============================================================================
  // EXPRESS SERVER FOR API ENDPOINTS
  // =============================================================================

  const app = express();
  app.use(express.json());

  // Enable CORS
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Get uploads
  app.get("/api/uploads", (req, res) => {
    try {
      const uploadsPath = join(process.cwd(), "data", "uploads.json");
      if (existsSync(uploadsPath)) {
        const data = readFileSync(uploadsPath, "utf-8");
        const uploads = JSON.parse(data);
        res.json({ total: uploads.length, uploads });
      } else {
        res.json({ total: 0, uploads: [] });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Slack events handler
  app.post("/api/slack/events", async (req, res) => {
    // Handle Slack slash commands
    // This would integrate with your existing Slack handler
    res.json({ text: "Slack integration coming soon" });
  });

  const handleDownloadRepoRequest = async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "GitHub URL required" });
      }
      
      const result = await downloadRepo(url);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  // Download repository endpoints (API + legacy path)
  app.post("/api/download-repo", handleDownloadRepoRequest);
  app.post("/download-repo", handleDownloadRepoRequest);

  // Player control endpoint (for remote control if needed)
  app.post("/api/player/input", (req, res) => {
    const { forward, strafe, turn } = req.body;
    setPlayerInput({ forward: forward || 0, strafe: strafe || 0, turn: turn || 0 });
    res.json({ success: true });
  });

  // Serve latest frame for preview (room.html)
  let latestFrameBuffer: Buffer | null = null;
  
  // Create initial black frame matching flipboard dimensions
  try {
    latestFrameBuffer = createBlackPNG(width, height);
    console.log(`✅ Initial frame buffer created: ${width}x${height}`);
  } catch (err: any) {
    console.error("❌ Failed to create initial frame:", err.message);
  }
  
  app.get("/api/frame", (req, res) => {
    try {
      if (latestFrameBuffer && latestFrameBuffer.length > 0) {
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.send(latestFrameBuffer);
      } else {
        console.warn("⚠️  No frame buffer available, sending placeholder");
        // Send a minimal 1x1 black PNG as fallback
        const placeholder = createBlackPNG(1, 1);
        res.setHeader("Content-Type", "image/png");
        res.send(placeholder);
      }
    } catch (err: any) {
      console.error("❌ Error serving frame:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Serve room.html preview page
  app.get("/room.html", (req, res) => {
    try {
      const roomHtmlPath = join(process.cwd(), "room.html");
      if (existsSync(roomHtmlPath)) {
        res.setHeader("Content-Type", "text/html");
        res.sendFile(roomHtmlPath);
      } else {
        res.status(404).send("room.html not found");
      }
    } catch (err: any) {
      console.error("❌ Failed to serve room.html:", err.message);
      res.status(404).send("room.html not found");
    }
  });
  
  // Serve at root URL - redirect to room.html
  app.get("/", (req, res) => {
    try {
      const roomHtmlPath = join(process.cwd(), "room.html");
      if (existsSync(roomHtmlPath)) {
        res.setHeader("Content-Type", "text/html");
        res.sendFile(roomHtmlPath);
      } else {
        res.status(404).json({ error: "room.html not found" });
      }
    } catch (err: any) {
      console.error("❌ Failed to serve room.html from root:", err.message);
      res.status(404).json({ error: "room.html not found" });
    }
  });

  // Optional: Save a single frame to disk (on demand, not automatic)
  app.get("/api/save-frame", (req, res) => {
    if (latestFrameBuffer) {
      try {
        // Create output directory if it doesn't exist
        if (!existsSync(outputDir)) {
          require("fs").mkdirSync(outputDir, { recursive: true });
        }
        const filename = join(outputDir, `frame-${Date.now()}.png`);
        require("fs").writeFileSync(filename, latestFrameBuffer);
        res.json({ 
          success: true, 
          filename: filename,
          message: "Frame saved successfully" 
        });
        console.log(`💾 Frame saved on demand: ${filename}`);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.status(404).json({ error: "No frame available to save" });
    }
  });

  // Start Express server
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🌐 API server running on port ${PORT}`);
    console.log(`👀 Preview (local): http://localhost:${PORT}/room.html`);
    console.log(`👀 Preview (server): https://i558110.hera.fontysict.net/api-testing/room.html`);
    console.log(`🖼️  Frame endpoint: http://localhost:${PORT}/api/frame`);
    console.log(`📡 Server will serve frames at: https://i558110.hera.fontysict.net/api-testing/api/frame`);
  }).on('error', (err: any) => {
    console.error(`❌ Failed to start server on port ${PORT}:`, err.message);
    if (err.code === 'EADDRINUSE') {
      console.error(`   Port ${PORT} is already in use. Try a different port or stop the other process.`);
    }
    process.exit(1);
  });

  // =============================================================================
  // MAIN RENDERING LOOP
  // =============================================================================

  // Load initial gallery data
  await loadGalleryData();

  const uploadsPath = join(process.cwd(), "data", "uploads.json");
  if (existsSync(uploadsPath)) {
    try {
      watch(uploadsPath, { persistent: false }, (eventType) => {
        if (eventType === "change" || eventType === "rename") {
          console.log("📂 uploads.json updated - reloading gallery data");
          loadGalleryData();
        }
      });
      console.log("👀 Watching uploads.json for gallery updates");
    } catch (watchErr: any) {
      console.warn(
        "⚠️  Failed to watch uploads.json for changes:",
        watchErr?.message || watchErr
      );
    }
  } else {
    console.warn("⚠️  data/uploads.json not found yet - waiting for Slack uploads");
  }

  if (GALLERY_REFRESH_INTERVAL_MS > 0) {
    const reloadInterval = setInterval(() => {
      loadGalleryData();
    }, GALLERY_REFRESH_INTERVAL_MS);
    if (typeof reloadInterval.unref === "function") {
      reloadInterval.unref();
    }
    console.log(
      `⏱️  Gallery auto-refresh every ${(
        GALLERY_REFRESH_INTERVAL_MS / 1000
      ).toFixed(1)}s`
    );
  }

  // Create ticker for consistent frame rate
  const ticker = new Ticker({ fps: FPS });

  let frameCount = 0;
  
  if (AUTO_MODE_DEFAULT) {
    console.log("🎮 Player movement: Auto-demo ENABLED by default");
  } else {
    console.log(
      "🎮 Player movement: Auto-mode DISABLED (stationary until input received)"
    );
  }
  console.log("   Use POST /api/player/input to control player movement");

    ticker.start(({ deltaTime, elapsedTime }) => {
    let imageData: ImageData | null = null;
    
    try {
      // Update player state (automatic movement or from API)
      updatePlayer(deltaTime);
      
      // Clear canvas
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      
      // Render the 3D room
      const playerState = getPlayerState();
      processGalleryInteractions(playerState);
      const galleryFrames = getGalleryFrames();
      
      try {
        renderRoom(ctx, width, height, playerState, galleryFrames);
      } catch (renderErr: any) {
        console.error("❌ renderRoom error:", renderErr.message);
        if (renderErr.stack) {
          console.error("   Stack:", renderErr.stack.split('\n').slice(0, 3).join('\n'));
        }
        // Draw error pattern
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, 10, 10); // White square in corner
        ctx.fillStyle = "#888";
        ctx.fillRect(width - 10, height - 10, 10, 10); // Gray square in corner
      }
      
      // Convert to binary (black/white) for flipboard
      imageData = ctx.getImageData(0, 0, width, height);
      if (!imageData) {
        console.error("❌ Failed to get imageData from canvas");
        return;
      }
      const data = imageData.data;
      
      // Convert to binary (black/white) for flipboard
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const binary = brightness > 127 ? 255 : 0;
        data[i] = binary;     // R
        data[i + 1] = binary; // G
        data[i + 2] = binary; // B
        data[i + 3] = 255;    // A
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Output to flipboard or save frame
      try {
        const buffer = canvas.toBuffer("image/png");
        if (buffer && buffer.length > 0) {
          // Always save latest frame for preview endpoint
          latestFrameBuffer = buffer;
          // Log first successful frame
          if (frameCount === 0) {
            console.log(`✅ First frame generated successfully (${buffer.length} bytes)`);
          }
        } else {
          console.warn("⚠️  Canvas buffer is empty, skipping frame update");
          // Use black PNG as fallback
          if (!latestFrameBuffer) {
            latestFrameBuffer = createBlackPNG(width, height);
          }
        }
      } catch (err: any) {
        console.error("❌ Failed to create canvas buffer:", err.message);
        // Use black PNG as fallback if buffer creation fails
        if (!latestFrameBuffer) {
          latestFrameBuffer = createBlackPNG(width, height);
        }
      }
      
      frameCount++;
    } catch (renderErr: any) {
      console.error("❌ Rendering error:", renderErr.message);
      if (frameCount % 60 === 0) {
        console.error("   This error is repeating - check rendering code");
      }
    }
    
    if (activeDisplays.length > 0 && imageData) {
      activeDisplays.forEach(({ instance, mode }) => {
        try {
          if (typeof instance.setImageData === "function") {
            instance.setImageData(imageData);
          }
          const shouldFlush =
            typeof instance.isDirty === "function"
              ? instance.isDirty()
              : true;
          if (shouldFlush && typeof instance.flush === "function") {
            instance.flush();
          }
        } catch (hardwareErr: any) {
          console.error(
            `❌ Failed to push frame to display [${mode}]:`,
            hardwareErr?.message || hardwareErr
          );
        }
      });
    }
    
    // Log performance (every 5 seconds)
    if (frameCount % 75 === 0) {
      console.log(`📊 FPS: ${(1000 / deltaTime).toFixed(1)}, Elapsed: ${(elapsedTime / 1000).toFixed(1)}s`);
    }
  });

  console.log(`🎮 Flipboard 3D Gallery Server started`);
  console.log(`📺 Display surface: ${width}x${height} pixels`);
  console.log(
    `⚡ Mode: ${
      IS_DEV_RUNTIME
        ? "Development (frames served via API, hardware optional)"
        : "Production (hardware + API)"
    }`
  );
  console.log(`🎨 Frame rate: ${FPS} FPS`);
  console.log(`💾 Save frames manually: http://localhost:${PORT}/api/save-frame`);
}

// Start the server with comprehensive error handling
main().catch((err) => {
  console.error("❌ Failed to start server:", err.message || String(err));
  if (err.stack) {
    // Only show first few lines of stack to avoid clutter
    const stackLines = err.stack.split('\n').slice(0, 5);
    console.error("   Stack:", stackLines.join('\n'));
  }
  console.error("");
  console.error("Troubleshooting:");
  console.error("1. Make sure Bun is installed: bun --version");
  console.error("2. Install dependencies: bun install");
  console.error("3. Check if port 3001 is available");
  console.error("4. Canvas errors are handled with fallback - server should still work");
  console.error("");
  console.error("If canvas errors persist, the server will use software fallback.");
  console.error("The server should still start - try accessing http://localhost:3001/room.html");
  
  // Don't exit immediately - let the user see the error
  // The server initialization might have partially succeeded
  setTimeout(() => {
    console.error("\nServer initialization failed. Exiting...");
    process.exit(1);
  }, 2000);
});

