import {
  TRIGGER_DISTANCE,
  LOOK_PRECISION,
  TRIGGER_COOLDOWN,
} from "./settings";
import { downloadRepo } from "./download-handler";
import { getGalleryFrames } from "./gallery-server";

interface PlayerState {
  x: number;
  y: number;
  angle: number;
}

const lastTriggerMap = new Map<string, number>();
const pendingDownloads = new Map<string, Promise<unknown>>();

function getFrameKey(frameIndex: number, url: string) {
  return `${frameIndex}:${url}`;
}

/**
 * Process gallery interactions for the current player state.
 * When the player looks at a painting within range, trigger repo download.
 */
export function processGalleryInteractions(player: PlayerState) {
  const frames = getGalleryFrames();
  if (!frames || frames.length === 0) {
    return;
  }

  const now = Date.now();

  frames.forEach((frame, index) => {
    const repoUrl = (frame?.url || "").trim();
    if (!repoUrl || repoUrl === "https://github.com") {
      return;
    }
    if (!repoUrl.includes("github.com")) {
      return;
    }

    const dx = frame.x + 0.0001 - player.x;
    const dy = frame.y + 0.0001 - player.y;
    const distance = Math.hypot(dx, dy);

    if (distance >= TRIGGER_DISTANCE) {
      return;
    }

    const angle = Math.atan2(dy, dx);
    let delta = angle - player.angle;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));

    if (Math.abs(delta) > LOOK_PRECISION) {
      return;
    }

    const triggerKey = getFrameKey(index, repoUrl);
    const lastTrigger = lastTriggerMap.get(triggerKey) ?? 0;

    if (now - lastTrigger < TRIGGER_COOLDOWN) {
      return;
    }

    if (pendingDownloads.has(triggerKey)) {
      return;
    }

    lastTriggerMap.set(triggerKey, now);

    const downloadPromise = downloadRepo(repoUrl)
      .then((result) => {
        console.log(
          `⬇️  Repo triggered from gallery: ${repoUrl} → ${result?.target_dir ?? "unknown"}`
        );
      })
      .catch((err) => {
        console.error(
          `❌ Failed to download repo from gallery trigger (${repoUrl}):`,
          err?.message || err
        );
      })
      .finally(() => {
        pendingDownloads.delete(triggerKey);
      });

    pendingDownloads.set(triggerKey, downloadPromise);
  });
}



