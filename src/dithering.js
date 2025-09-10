// Dithering utilities for flipdot display

// Floyd-Steinberg dithering for low-res screens
export function floydSteinbergDither(imageData, width, height, threshold = 128) {
    const data = imageData.data;
    const luminance = new Array(width * height);

    // Calculate luminance
    for (let i = 0; i < width * height; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        luminance[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const old = luminance[idx];
            const newVal = old < threshold ? 0 : 255;
            const err = old - newVal;
            luminance[idx] = newVal;

            // Distribute error (Floyd-Steinberg)
            // Right
            if (x + 1 < width) luminance[idx + 1] += err * 7 / 16;
            // Down-Left
            if (x - 1 >= 0 && y + 1 < height) luminance[idx + width - 1] += err * 3 / 16;
            // Down
            if (y + 1 < height) luminance[idx + width] += err * 5 / 16;
            // Down-Right
            if (x + 1 < width && y + 1 < height) luminance[idx + width + 1] += err * 1 / 16;
        }
    }

    // Write back
    for (let i = 0; i < width * height; i++) {
        const v = luminance[i] > 127 ? 255 : 0;
        data[i * 4] = v;
        data[i * 4 + 1] = v;
        data[i * 4 + 2] = v;
        data[i * 4 + 3] = 255;
    }
    return imageData;
}

// This function is now moved to mock-spotify.js to avoid duplication
