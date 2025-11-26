import fs from 'fs';
import path from 'path';
import { Upload, SlackData } from '../types/upload';
import { GitHubRepoInfo } from '../types/github';

// In-memory storage as fallback
let inMemoryUploads: Upload[] = [];

// Use /tmp in production (writable in serverless), data/ in development
const UPLOADS_FILE = process.env.NODE_ENV === 'production' 
  ? path.join('/tmp', 'uploads.json')
  : path.join(process.cwd(), 'data', 'uploads.json');

// Track if file system is available (null = not checked yet)
let fileSystemAvailable: boolean | null = null;

function checkFileSystemAvailable(): boolean {
  // Return cached result if already checked
  if (fileSystemAvailable !== null) return fileSystemAvailable;
  
  try {
    const dir = path.dirname(UPLOADS_FILE);
    // Try to create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Test write capability
    const testFile = path.join(dir, '.test-write');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    fileSystemAvailable = true;
    console.log('File system storage available at:', UPLOADS_FILE);
    return true;
  } catch (error) {
    console.warn('File system not available, using in-memory storage:', error);
    fileSystemAvailable = false;
    return false;
  }
}

function loadFromFile(): Upload[] {
  if (!checkFileSystemAvailable()) return [];
  
  try {
    if (fs.existsSync(UPLOADS_FILE)) {
      const content = fs.readFileSync(UPLOADS_FILE, 'utf8');
      const uploads = JSON.parse(content) || [];
      console.log(`Loaded ${uploads.length} uploads from file`);
      return uploads;
    }
  } catch (error) {
    console.warn('Error reading uploads from file:', error);
    fileSystemAvailable = false;
  }
  return [];
}

function saveToFile(uploads: Upload[]): boolean {
  if (!checkFileSystemAvailable()) return false;
  
  try {
    const dir = path.dirname(UPLOADS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(UPLOADS_FILE, JSON.stringify(uploads, null, 2));
    console.log(`Saved ${uploads.length} uploads to file`);
    return true;
  } catch (error) {
    console.warn('Error saving uploads to file:', error);
    fileSystemAvailable = false;
    return false;
  }
}

export function getUploads(): Upload[] {
  // Always try file system first
  const fileUploads = loadFromFile();
  console.log('getUploads() called:', {
    fileSystemAvailable,
    fileUploadsCount: fileUploads.length,
    inMemoryCount: inMemoryUploads.length,
    uploadsFile: UPLOADS_FILE,
    nodeEnv: process.env.NODE_ENV
  });
  
  if (fileSystemAvailable || fileUploads.length > 0) {
    return fileUploads;
  }
  // Fallback to in-memory only if file system is not available
  return inMemoryUploads;
}

export function logUpload(githubUrl: string, repoInfo: GitHubRepoInfo, slackData: SlackData): void {
  try {
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
    
    // Try to save to file, fallback to in-memory
    if (!saveToFile(limitedUploads)) {
      inMemoryUploads = limitedUploads;
      console.warn('Saved to in-memory storage (not persistent across serverless invocations)');
    }
  } catch (error) {
    console.error('Error logging upload:', error);
  }
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

