import express from "express";
import multer from "multer";
import { createCanvas, loadImage } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";

const IS_DEV = process.argv.includes("--dev");

// Create display
const display = new Display({
  layout: LAYOUT,
  panelWidth: 28,
  isMirrored: true,
  transport: !IS_DEV
    ? {
        type: "serial",
        path: "/dev/ttyACM0",
        baudRate: 57600,
      }
    : {
        type: "ip",
        host: "127.0.0.1",
        port: 3000,
      },
});

const { width, height } = display;

// Ensure output dir exists
const outputDir = "./output";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Express setup
const app = express();
const upload = multer({ dest: "uploads/" });

// Serve static files from output directory
app.use("/output", express.static(outputDir));

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // Load and resize image
    const img = await loadImage(filePath);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
  // Apply small blur + contrast boost
ctx.filter = "blur(0.5px) contrast(1.3)";

// Calculate aspect ratio
const imgAspect = img.width / img.height;
const displayAspect = width / height;

let drawWidth, drawHeight, offsetX, offsetY;

if (imgAspect > displayAspect) {
  // Image is wider than display
  drawWidth = width;
  drawHeight = width / imgAspect;
  offsetX = 0;
  offsetY = (height - drawHeight) / 2;
} else {
  // Image is taller than display
  drawHeight = height;
  drawWidth = height * imgAspect;
  offsetX = (width - drawWidth) / 2;
  offsetY = 0;
}

// Fill background (optional, for black border)
ctx.fillStyle = "black";
ctx.fillRect(0, 0, width, height);

// Draw centered image with correct proportions
ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

// Reset filter
ctx.filter = "none";


 // Convert to black & white using Floyd–Steinberg dithering
const imageData = ctx.getImageData(0, 0, width, height);
const data = imageData.data;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const oldPixel = data[i];
    const newPixel = oldPixel < 128 ? 0 : 255;
    const error = oldPixel - newPixel;

    // set pixel
    data[i] = data[i + 1] = data[i + 2] = newPixel;
    data[i + 3] = 255;

    // distribute the error to neighboring pixels
    const distribute = (dx, dy, factor) => {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
      const ni = (ny * width + nx) * 4;
      data[ni] += error * factor;
      data[ni + 1] += error * factor;
      data[ni + 2] += error * factor;
    };

    distribute(1, 0, 7 / 16);
    distribute(-1, 1, 3 / 16);
    distribute(0, 1, 5 / 16);
    distribute(1, 1, 1 / 16);
  }
}

ctx.putImageData(imageData, 0, 0);

    // Save processed black/white image
    const outPath = path.join(outputDir, "uploaded.png");
    fs.writeFileSync(outPath, canvas.toBuffer("image/png"));


    if (!IS_DEV) {
      // Send to flipdot hardware
      display.setImageData(imageData);
      if (display.isDirty()) {
        display.flush();
      }
    }

    // Redirect back to homepage to show image
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing image: " + err.message);
  }
});

// Home page with upload + preview
app.get("/", (req, res) => {
  res.send(`
    <h1>Flipdot Image Uploader</h1>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="image" />
      <button type="submit">Upload</button>
    </form>
    <h2>Latest Uploaded Image:</h2>
    <img src="/output/uploaded.png?${Date.now()}" alt="Uploaded Image" style="border:1px solid #333; max-width:100%;" />
  `);
});

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Flipdot image uploader running at http://localhost:${PORT}`);
});
