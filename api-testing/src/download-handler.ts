/**
 * Server-side GitHub Repository Download Handler
 * Uses download-git-repo package
 */

import download from "download-git-repo";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

// Promisify download-git-repo manually
function downloadRepoAsync(repo: string, dest: string, options?: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const finalOptions = options || {};
    download(repo, dest, finalOptions, (err: Error | null) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Download a GitHub repository
 */
export async function downloadRepo(githubUrl: string) {
  try {
    // Parse GitHub URL
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?(?:\/(.*))?/);
    
    if (!match) {
      throw new Error("Invalid GitHub URL format");
    }
    
    const [, owner, repo, branch = "main"] = match;
    
    // Create destination directory
    const baseDir = join(process.cwd(), "test-flipboard-upload");
    if (!existsSync(baseDir)) {
      mkdirSync(baseDir, { recursive: true });
    }
    
    // Create unique directory name
    const timestamp = Date.now();
    const safeOwner = owner.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const safeRepo = repo.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const safeBranch = branch.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const dirName = `${safeOwner}_${safeRepo}_${safeBranch}_${timestamp}`;
    const targetDir = join(baseDir, dirName);
    
    // Format for download-git-repo: github:owner/repo#branch
    const repoPath = `github:${owner}/${repo}${branch !== "main" ? `#${branch}` : ""}`;
    
    console.log(`📥 Downloading ${repoPath} to ${targetDir}`);
    
    // Download repository
    await downloadRepoAsync(repoPath, targetDir);
    
    console.log(`✅ Successfully downloaded to: ${targetDir}`);
    
    return {
      success: true,
      target_dir: `test-flipboard-upload/${dirName}`,
      absolute_path: targetDir,
      method: "download-git-repo",
      owner,
      repo,
      branch,
      url: githubUrl,
    };
  } catch (err: any) {
    console.error("❌ Download failed:", err);
    throw new Error(err.message || "Failed to download repository");
  }
}

