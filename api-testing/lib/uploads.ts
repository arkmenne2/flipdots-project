import fs from 'fs';
import path from 'path';
import { GitHubRepoInfo } from './github';

export interface Upload {
  id: string;
  timestamp: string;
  github_url: string;
  repository: string;
  branch: string;
  path: string;
  slack_user: string;
  slack_channel: string;
}

export interface SlackData {
  user_name?: string;
  channel_name?: string;
}

const UPLOADS_FILE = path.join(process.cwd(), 'data', 'uploads.json');

function ensureDataDirectory() {
  const dataDir = path.dirname(UPLOADS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function getUploads(): Upload[] {
  try {
    ensureDataDirectory();
    if (fs.existsSync(UPLOADS_FILE)) {
      const content = fs.readFileSync(UPLOADS_FILE, 'utf8');
      return JSON.parse(content) || [];
    }
  } catch (error) {
    console.error('Error reading uploads:', error);
  }
  return [];
}

export function logUpload(githubUrl: string, repoInfo: GitHubRepoInfo, slackData: SlackData): void {
  try {
    ensureDataDirectory();
    const uploads = getUploads();
    
    const upload: Upload = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      github_url: githubUrl,
      repository: `${repoInfo.owner}/${repoInfo.repo}`,
      branch: repoInfo.branch,
      path: repoInfo.path,
      slack_user: slackData.user_name || 'unknown',
      slack_channel: slackData.channel_name || 'unknown'
    };
    
    // Add to beginning and keep only last 6
    uploads.unshift(upload);
    const limitedUploads = uploads.slice(0, 6);
    
    fs.writeFileSync(UPLOADS_FILE, JSON.stringify(limitedUploads, null, 2));
  } catch (error) {
    console.error('Error logging upload:', error);
  }
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

