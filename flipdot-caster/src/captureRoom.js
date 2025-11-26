import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';

export async function captureRoomFrames({
  roomUrl,
  frames,
  frameDelayMs,
  viewport,
  outputDir,
  selector
}) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(roomUrl, { waitUntil: 'networkidle2', timeout: 60_000 });
    if (selector) {
      await page.waitForSelector(selector, { timeout: 30_000 });
    }

    const captured = [];

    for (let i = 0; i < frames; i += 1) {
      if (frameDelayMs > 0) {
        await page.waitForTimeout(frameDelayMs);
      }

      let buffer;
      if (selector) {
        const element = await page.$(selector);
        if (!element) {
          throw new Error(`Selector ${selector} not found during capture`);
        }
        buffer = await element.screenshot({ type: 'png' });
      } else {
        buffer = await page.screenshot({ type: 'png' });
      }
      const meta = { index: i, capturedAt: Date.now(), buffer };

      if (outputDir) {
        await fs.mkdir(outputDir, { recursive: true });
        const filePath = `${outputDir}/room-frame-${i}.png`;
        await fs.writeFile(filePath, buffer);
        meta.filePath = filePath;
      }

      captured.push(meta);
    }

    return captured;
  } finally {
    await browser.close();
  }
}

