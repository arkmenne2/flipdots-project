import fs from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import puppeteer from 'puppeteer';
import { encodeForFlipdot } from './flipdotEncoder.js';
import { dispatchFrame } from './flipdotTransport.js';

export class LiveCaptureService {
  constructor({
    roomUrl,
    viewport,
    selector,
    frameRate,
    outputDir,
    retainFrames,
    boardConfig,
    transportConfig
  }) {
    this.roomUrl = roomUrl;
    this.viewport = viewport;
    this.selector = selector;
    this.frameIntervalMs = Math.max(1, Math.round(1000 / frameRate));
    this.outputDir = outputDir;
    this.retainFrames = retainFrames;
    this.boardConfig = boardConfig;
    this.transportConfig = transportConfig;

    this.browser = null;
    this.page = null;
    this.targetElement = null;
    this.anchorSelector = selector ?? '.stage, #v';
    this.clipRegion = null;
    this.frameHistory = [];
    this.latestFrame = null;
    this.running = false;
    this.loopPromise = null;
    this.stats = {
      framesCaptured: 0,
      framesDispatched: 0,
      errors: 0,
      startedAt: null,
      lastError: null
    };
  }

  async start() {
    if (this.running) {
      return;
    }

    await fs.mkdir(this.outputDir, { recursive: true });
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport(this.viewport);
    await this.page.goto(this.roomUrl, { waitUntil: 'networkidle2', timeout: 60_000 });
    await this.page.waitForSelector(this.anchorSelector, { timeout: 30_000 });
    if (this.selector) {
      await this.page.waitForSelector(this.selector, { timeout: 30_000 });
      this.targetElement = await this.page.$(this.selector);
      if (!this.targetElement) {
        throw new Error(`Unable to locate element ${this.selector}`);
      }
    }
    await this.#prepareStageViewport(this.anchorSelector);
    if (!this.targetElement) {
      this.clipRegion = await this.#resolveClipRegion(this.anchorSelector);
      if (!this.clipRegion) {
        throw new Error('Unable to locate the flipdot display area.');
      }
    }

    this.running = true;
    this.stats.startedAt = Date.now();
    this.loopPromise = this.#captureLoop();
  }

  async stop() {
    this.running = false;
    if (this.loopPromise) {
      await this.loopPromise;
    }
    await this.page?.close();
    await this.browser?.close();
  }

  getLatestFrame() {
    return this.latestFrame;
  }

  getStats() {
    const uptimeMs = this.stats.startedAt ? Date.now() - this.stats.startedAt : 0;
    return { ...this.stats, frameIntervalMs: this.frameIntervalMs, uptimeMs };
  }

  async #captureLoop() {
    while (this.running) {
      const startedAt = Date.now();
      try {
        let buffer;
        if (this.targetElement) {
          buffer = await this.targetElement.screenshot({ type: 'png' });
        } else {
          const screenshotOptions = { type: 'png' };
          if (this.clipRegion) {
            screenshotOptions.clip = this.clipRegion;
          }
          buffer = await this.page.screenshot(screenshotOptions);
        }
        this.stats.framesCaptured += 1;

        await this.#persistFrame(buffer, startedAt);
        await this.#dispatchToBoard(buffer);
      } catch (error) {
        this.stats.errors += 1;
        this.stats.lastError = error.message;
        console.error('[live-capture] frame loop failed', error);
      } finally {
        const elapsed = Date.now() - startedAt;
        const waitTime = Math.max(0, this.frameIntervalMs - elapsed);
        if (!this.running) {
          break;
        }
        await delay(waitTime);
      }
    }
  }

  async #persistFrame(buffer, capturedAt) {
    const fileName = `frame-${capturedAt}.png`;
    const filePath = path.join(this.outputDir, fileName);
    const latestPath = path.join(this.outputDir, 'latest.png');

    await fs.writeFile(filePath, buffer);
    await fs.writeFile(latestPath, buffer);

    this.frameHistory.push(filePath);
    if (this.frameHistory.length > this.retainFrames) {
      const obsolete = this.frameHistory.shift();
      if (obsolete) {
        await fs.rm(obsolete, { force: true });
      }
    }

    this.latestFrame = { buffer, filePath, capturedAt };
  }

  async #dispatchToBoard(buffer) {
    try {
      const payload = await encodeForFlipdot(buffer, this.boardConfig);
      await dispatchFrame(payload, {
        transport: this.boardConfig.transport,
        transportConfig: this.transportConfig
      });
      this.stats.framesDispatched += 1;
    } catch (error) {
      // Keep the loop alive even if the board is temporarily offline.
      this.stats.errors += 1;
      this.stats.lastError = error.message;
      console.error('[live-capture] failed to dispatch frame to flipdot', error);
    }
  }

  async #prepareStageViewport(anchorSelector) {
    await this.page.evaluate((selector) => {
      const target =
        document.querySelector(selector) ??
        document.querySelector('.stage') ??
        document.querySelector('#v');
      if (!target) {
        return;
      }
      const block = target.classList?.contains('stage') ? 'center' : 'nearest';
      target.scrollIntoView({ block, inline: 'center', behavior: 'instant' });
    }, anchorSelector);
    await delay(300);
  }

  async #resolveClipRegion(anchorSelector) {
    const rect = await this.page.evaluate((selector) => {
      const target =
        document.querySelector(selector) ??
        document.querySelector('.stage') ??
        document.querySelector('#v');
      if (!target) {
        return null;
      }
      const bounds = target.getBoundingClientRect();
      return {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height
      };
    }, anchorSelector);

    if (!rect) {
      return null;
    }

    const x = Math.max(0, Math.floor(rect.x));
    const y = Math.max(0, Math.floor(rect.y));
    const width = Math.min(this.viewport.width - x, Math.ceil(rect.width));
    const height = Math.min(this.viewport.height - y, Math.ceil(rect.height));

    if (width <= 0 || height <= 0) {
      return null;
    }

    return { x, y, width, height };
  }
}

