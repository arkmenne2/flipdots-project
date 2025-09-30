export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

export function isValidGitHubUrl(url: string): boolean {
  const pattern = /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+(?:\/tree\/[\w\-\.\/]+)?(?:\/[\w\-\.\/]*)?$/;
  return pattern.test(url);
}

export function parseGitHubUrl(url: string): GitHubRepoInfo | null {
  const pattern = /https:\/\/github\.com\/([\w\-\.]+)\/([\w\-\.]+)(?:\/tree\/([\w\-\.\/]+))?(?:\/(.*))?/;
  const match = url.match(pattern);
  
  if (match) {
    return {
      owner: match[1],
      repo: match[2],
      branch: match[3] || 'main',
      path: match[4] || ''
    };
  }
  
  return null;
}

