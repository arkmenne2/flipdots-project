/**
 * Server-side Gallery Data Management
 * Fetches gallery data from API and manages gallery frames
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface GalleryFrame {
  x: number;
  y: number;
  url: string;
  title: string;
  user: string;
  timestamp?: string;
  colorIndex?: number;
}

interface Upload {
  github_url: string;
  repository?: string;
  repo_name?: string;
  slack_user?: string;
  user_name?: string;
  branch?: string;
  timestamp?: string;
}

// Gallery frames (6 paintings on walls)
let galleryFrames: GalleryFrame[] = [
  { x: 11, y: 6, url: "https://github.com", title: "Loading...", user: "system" },
  { x: 1, y: 6, url: "https://github.com", title: "Loading...", user: "system" },
  { x: 6, y: 1, url: "https://github.com", title: "Loading...", user: "system" },
  { x: 6, y: 11, url: "https://github.com", title: "Loading...", user: "system" },
  { x: 3, y: 1, url: "https://github.com", title: "Loading...", user: "system" },
  { x: 8, y: 11, url: "https://github.com", title: "Loading...", user: "system" },
];

// Predefined painting positions
const paintingPositions = [
  { x: 11, y: 6 },
  { x: 1, y: 6 },
  { x: 6, y: 1 },
  { x: 6, y: 11 },
  { x: 3, y: 1 },
  { x: 8, y: 11 },
];

/**
 * Load gallery data from API or file
 */
export async function loadGalleryData() {
  try {
    const uploadsPath = join(process.cwd(), "data", "uploads.json");
    let uploads: Upload[] = [];
    
    if (existsSync(uploadsPath)) {
      const data = readFileSync(uploadsPath, "utf-8");
      const parsed = JSON.parse(data);
      uploads = Array.isArray(parsed) ? parsed : parsed.uploads || [];
    }
    
    // Update gallery frames with upload data
    galleryFrames = paintingPositions.map((pos, i) => {
      if (i < uploads.length && uploads[i]) {
        const upload = uploads[i];
        const repoName =
          upload.repo_name ||
          (upload.repository
            ? upload.repository.split("/").pop() || upload.repository
            : null) ||
          "Unknown Repository";
        const userName =
          upload.user_name || upload.slack_user || "Unknown Contributor";
        const repoUrl =
          upload.github_url ||
          upload.repository ||
          "https://github.com/electromalina/flipdots-project";
        
        return {
          x: pos.x,
          y: pos.y,
          url: repoUrl,
          title: repoName,
          user: userName,
          timestamp: upload.timestamp,
          colorIndex: i,
        };
      }
      return {
        x: pos.x,
        y: pos.y,
        url: "https://github.com",
        title: "Empty Slot",
        user: "system",
        colorIndex: i,
      };
    });
    
    console.log(`✅ Loaded ${galleryFrames.length} gallery frames`);
  } catch (err: any) {
    console.error("❌ Failed to load gallery data:", err.message);
  }
}

/**
 * Get current gallery frames
 */
export function getGalleryFrames(): GalleryFrame[] {
  return galleryFrames;
}

/**
 * Reload gallery data (call periodically or on API update)
 */
export async function reloadGalleryData() {
  await loadGalleryData();
}




