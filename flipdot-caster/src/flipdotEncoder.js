import sharp from 'sharp';

const bitsPerByte = 8;

export async function encodeForFlipdot(buffer, { width, height, threshold }) {
  const image = sharp(buffer).resize(width, height, { fit: 'cover' }).greyscale();
  const { data } = await image.raw().toBuffer({ resolveWithObject: true });

  const totalPixels = width * height;
  const outputBytes = Math.ceil(totalPixels / bitsPerByte);
  const payload = Buffer.alloc(outputBytes);

  for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex += 1) {
    const intensity = data[pixelIndex];
    const bit = intensity < threshold ? 1 : 0;
    const byteIndex = Math.floor(pixelIndex / bitsPerByte);
    const bitIndex = pixelIndex % bitsPerByte;
    payload[byteIndex] |= bit << (7 - bitIndex);
  }

  return payload;
}

