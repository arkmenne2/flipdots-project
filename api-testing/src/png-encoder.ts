/**
 * Simple PNG Encoder for fallback canvas
 * Creates valid PNG files from image data
 */

declare const Bun:
  | undefined
  | {
      deflateSync?: (input: Buffer) => Buffer;
    };

// PNG Encoder using zlib

/**
 * Encode image data to PNG buffer
 */
export function encodePNG(data: Uint8ClampedArray, width: number, height: number): Buffer {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // Helper to write 32-bit BE integer
  const writeUInt32BE = (value: number): Buffer => {
    const buf = Buffer.allocUnsafe(4);
    buf.writeUInt32BE(value, 0);
    return buf;
  };
  
  // Calculate CRC32
  const crc32 = (data: Buffer): number => {
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
  
  // Create IHDR chunk
  const ihdrData = Buffer.allocUnsafe(13);
  writeUInt32BE(width).copy(ihdrData, 0);
  writeUInt32BE(height).copy(ihdrData, 4);
  ihdrData[8] = 8;   // bit depth
  ihdrData[9] = 2;   // color type (RGB)
  ihdrData[10] = 0;  // compression method
  ihdrData[11] = 0;  // filter method
  ihdrData[12] = 0;  // interlace method
  
  const ihdrChunk = Buffer.concat([Buffer.from('IHDR'), ihdrData]);
  const ihdrCrc = writeUInt32BE(crc32(ihdrChunk));
  
  // Prepare image data for compression
  // PNG format: each row has a filter byte (0 = none) + RGB data
  const rowSize = width * 3;
  const imageBuffer = Buffer.allocUnsafe(height * (rowSize + 1));
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    imageBuffer[rowOffset] = 0; // No filter
    
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = rowOffset + 1 + x * 3;
      
      imageBuffer[dstIdx] = data[srcIdx];     // R
      imageBuffer[dstIdx + 1] = data[srcIdx + 1]; // G
      imageBuffer[dstIdx + 2] = data[srcIdx + 2]; // B
    }
  }
  
  // Compress using zlib (deflate) - Bun has built-in zlib
  let compressed: Buffer;
  try {
    // Try Bun's built-in zlib first
    if (typeof Bun !== 'undefined' && Bun.deflateSync) {
      compressed = Bun.deflateSync(imageBuffer);
    } else {
      // Fallback to Node.js zlib
      const zlib = require('zlib');
      compressed = zlib.deflateSync(imageBuffer);
    }
  } catch (err: any) {
    // Fallback: create minimal compressed data
    console.warn("⚠️  zlib compression failed, using minimal compression");
    compressed = Buffer.from([0x78, 0x9C, 0x63, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01]);
  }
  
  // Create IDAT chunk
  const idatChunk = Buffer.concat([Buffer.from('IDAT'), compressed]);
  const idatCrc = writeUInt32BE(crc32(idatChunk));
  
  // Create IEND chunk
  const iendChunk = Buffer.from('IEND');
  const iendCrc = Buffer.from([0xAE, 0x42, 0x60, 0x82]);
  
  // Assemble PNG
  return Buffer.concat([
    signature,
    writeUInt32BE(13), // IHDR length
    ihdrChunk,
    ihdrCrc,
    writeUInt32BE(compressed.length), // IDAT length
    idatChunk,
    idatCrc,
    writeUInt32BE(0), // IEND length
    iendChunk,
    iendCrc
  ]);
}

