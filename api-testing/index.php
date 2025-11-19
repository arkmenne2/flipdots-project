<?php
/**
 * =============================================================================
 * FLIPBOARD SLACK API BACKEND
 * =============================================================================
 * 
 * This PHP backend handles Slack slash command integration and provides
 * API endpoints for the Flipboard dashboard and 3D gallery room.
 * 
 * Features:
 * - Slack slash command processing (/upload-flipboard)
 * - GitHub repository validation and storage
 * - RESTful API endpoints for dashboard and gallery
 * - CORS support for cross-origin requests
 * - JSON data storage for upload history
 * 
 * API Endpoints:
 * - POST /slack/events - Slack slash command handler
 * - GET /uploads - Get list of uploaded repositories
 * - GET /dashboard - Dashboard HTML page
 * - GET / - Health check endpoint
 * 
 * Data Storage:
 * - uploads.json - Stores last 6 uploaded repositories
 * - JSON format with metadata (timestamp, user, repository info)
 * 
 * Author: Flipboard Project Team
 * Last Updated: 2024
 * =============================================================================
 */

// Enable CORS for cross-origin requests (needed for dashboard/gallery)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS requests (required for CORS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// =============================================================================
// REQUEST ROUTING
// =============================================================================

// Parse the incoming request URL to determine which endpoint to handle
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);

// Remove the base path if it exists (for subdirectory deployments)
$basePath = '/api-testing';
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}

// Route handling - dispatch requests to appropriate handlers
switch ($path) {
    // Health check endpoint - returns server status
    case '/':
    case '/index.php':
        header('Content-Type: application/json');
        echo json_encode([
            'message' => 'Flipboard Slack API Server',
            'status' => 'Running',
            'endpoints' => [
                'health' => '/health',
                'slack_events' => '/slack/events',
                'dashboard' => '/dashboard',
                'uploads' => '/uploads'
            ],
            'timestamp' => date('c')
        ]);
        break;
        
    case '/health':
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'OK',
            'timestamp' => date('c')
        ]);
        break;
        
    case '/slack/events':
        handleSlackEvents();
        break;
        
    case '/dashboard':
        showDashboard();
        break;
        
    case '/uploads':
        showUploads();
        break;
    
    case '/download-repo':
        handleDownloadRepo();
        break;
        
    default:
        // Check if request is for a file in test-flipboard-upload directory
        if (preg_match('#^/test-flipboard-upload/(.+)$#', $path, $matches)) {
            serveDownloadedFile($matches[1]);
            break;
        }
        
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}

function handleSlackEvents() {
    header('Content-Type: application/json');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Get POST data
    $input = file_get_contents('php://input');
    parse_str($input, $data);
    
    // Log the request for debugging
    error_log('Slack request: ' . print_r($data, true));
    
    // Check if it's a slash command
    if (!isset($data['command']) || $data['command'] !== '/upload-flipboard') {
        echo json_encode(['text' => 'Unknown command']);
        return;
    }
    
    $text = isset($data['text']) ? trim($data['text']) : '';
    
    // Validate GitHub URL
    if (empty($text)) {
        echo json_encode([
            'text' => '❌ Please provide a GitHub URL. Usage: `/upload-flipboard https://github.com/user/repo`',
            'response_type' => 'ephemeral'
        ]);
        return;
    }
    
    // Handle @mention format
    $githubUrl = $text;
    if (strpos($text, '@') === 0) {
        $githubUrl = substr($text, 1);
    }
    
    // Validate GitHub URL
    if (!isValidGitHubUrl($githubUrl)) {
        echo json_encode([
            'text' => '❌ Invalid GitHub URL. Please provide a valid GitHub repository URL.',
            'response_type' => 'ephemeral'
        ]);
        return;
    }
    
    // Parse GitHub URL
    $repoInfo = parseGitHubUrl($githubUrl);
    if (!$repoInfo) {
        echo json_encode([
            'text' => '❌ Could not parse GitHub URL. Please check the format.',
            'response_type' => 'ephemeral'
        ]);
        return;
    }
    
    // Create response
    $response = [
        'text' => '🎮 Flipboard Upload Successful!',
        'blocks' => [
            [
                'type' => 'header',
                'text' => [
                    'type' => 'plain_text',
                    'text' => '🎮 Flipboard Upload Successful!'
                ]
            ],
            [
                'type' => 'section',
                'fields' => [
                    [
                        'type' => 'mrkdwn',
                        'text' => '*Repository:* ' . $repoInfo['owner'] . '/' . $repoInfo['repo']
                    ],
                    [
                        'type' => 'mrkdwn',
                        'text' => '*Branch:* ' . $repoInfo['branch']
                    ]
                ]
            ],
            [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => '*GitHub URL:* <' . $githubUrl . '|View Repository>'
                ]
            ],
            [
                'type' => 'actions',
                'elements' => [
                    [
                        'type' => 'button',
                        'text' => [
                            'type' => 'plain_text',
                            'text' => '🎮 View Doom Game'
                        ],
                        'url' => $githubUrl,
                        'style' => 'primary'
                    ]
                ]
            ]
        ]
    ];
    
    echo json_encode($response);
    
    // Log the upload
    logUpload($githubUrl, $repoInfo, $data);
}

/**
 * Handle repository download requests
 * Route: GET/POST /download-repo?url=<github_repo_url>
 * Body (JSON or form): { "url": "https://github.com/owner/repo[/tree/branch]" }
 *
 * Behavior:
 * - Creates directory "test-flipboard-upload" if not exists
 * - Tries to `git clone --depth 1` the repository into a timestamped folder
 * - Falls back to downloading the repository ZIP if git is not available
 */
function handleDownloadRepo() {
    header('Content-Type: application/json');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    // Read URL from query, JSON body, or form data
    $githubUrl = null;
    if (isset($_GET['url'])) {
        $githubUrl = trim($_GET['url']);
    } else {
        $rawBody = file_get_contents('php://input');
        $data = [];
        if ($rawBody) {
            $json = json_decode($rawBody, true);
            if (is_array($json) && isset($json['url'])) {
                $data = $json;
            } else {
                parse_str($rawBody, $data);
            }
        }
        if (isset($data['url'])) {
            $githubUrl = trim($data['url']);
        }
    }

    if (!$githubUrl || !isValidGitHubUrl($githubUrl)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or missing GitHub URL']);
        return;
    }

    $repoInfo = parseGitHubUrl($githubUrl);
    if (!$repoInfo) {
        http_response_code(400);
        echo json_encode(['error' => 'Unable to parse GitHub URL']);
        return;
    }

    $baseDir = __DIR__ . DIRECTORY_SEPARATOR . 'test-flipboard-upload';
    if (!is_dir($baseDir)) {
        @mkdir($baseDir, 0775, true);
    }

    $safeOwner = preg_replace('/[^a-zA-Z0-9_.-]+/', '_', $repoInfo['owner']);
    $safeRepo = preg_replace('/[^a-zA-Z0-9_.-]+/', '_', $repoInfo['repo']);
    $safeBranch = preg_replace('/[^a-zA-Z0-9_.-]+/', '_', $repoInfo['branch']);
    $targetDir = $baseDir . DIRECTORY_SEPARATOR . $safeOwner . '__' . $safeRepo . '__' . $safeBranch . '__' . date('Ymd_His');

    $result = [
        'requested_url' => $githubUrl,
        'owner' => $repoInfo['owner'],
        'repo' => $repoInfo['repo'],
        'branch' => $repoInfo['branch'],
        'target_dir' => $targetDir,
        'method' => null,
        'stdout' => '',
        'stderr' => '',
        'success' => false
    ];

    // Try git clone first (if available)
    $gitAvailable = function_exists('exec') && commandExists('git');
    if ($gitAvailable) {
        @mkdir($targetDir, 0775, true);
        $cloneUrl = 'https://github.com/' . $repoInfo['owner'] . '/' . $repoInfo['repo'] . '.git';
        $branchArg = $repoInfo['branch'] ? (' -b ' . escapeshellarg($repoInfo['branch'])) : '';
        $cmd = 'git clone --depth 1' . $branchArg . ' ' . escapeshellarg($cloneUrl) . ' ' . escapeshellarg($targetDir) . ' 2>&1';
        
        $output = [];
        $returnCode = 0;
        exec($cmd, $output, $returnCode);
        
        $result['method'] = 'git';
        $result['stdout'] = implode("\n", $output);
        $result['stderr'] = $returnCode !== 0 ? implode("\n", $output) : '';
        $result['success'] = $returnCode === 0 && is_dir($targetDir);
    }

    // Fallback: download ZIP archive and extract (if ZipArchive available)
    if (!$result['success'] && class_exists('ZipArchive')) {
        @mkdir($targetDir, 0775, true);
        $zipUrl = 'https://github.com/' . $repoInfo['owner'] . '/' . $repoInfo['repo'] . '/archive/refs/heads/' . $repoInfo['branch'] . '.zip';
        $zipFile = $targetDir . '.zip';
        
        $context = stream_context_create([
            'http' => [
                'timeout' => 30,
                'user_agent' => 'Flipboard-Downloader/1.0'
            ]
        ]);
        
        $downloaded = @file_put_contents($zipFile, @file_get_contents($zipUrl, false, $context));
        if ($downloaded && $downloaded > 0) {
            $zip = new ZipArchive();
            if ($zip->open($zipFile) === true) {
                $zip->extractTo($targetDir);
                $zip->close();
                @unlink($zipFile);
                $result['method'] = 'zip';
                $result['success'] = true;
            } else {
                $result['method'] = 'zip';
                $result['stderr'] = 'Failed to open ZIP archive';
            }
        } else {
            $result['method'] = $result['method'] ?: 'zip';
            $result['stderr'] = 'Failed to download ZIP from GitHub (size: ' . ($downloaded ?: 0) . ')';
        }
    }

    // Final fallback: create a simple info file
    if (!$result['success']) {
        @mkdir($targetDir, 0775, true);
        $infoFile = $targetDir . DIRECTORY_SEPARATOR . 'repo-info.txt';
        $info = "GitHub Repository: {$githubUrl}\n";
        $info .= "Owner: {$repoInfo['owner']}\n";
        $info .= "Repository: {$repoInfo['repo']}\n";
        $info .= "Branch: {$repoInfo['branch']}\n";
        $info .= "Downloaded: " . date('Y-m-d H:i:s') . "\n";
        $info .= "Note: Full download not available on this server\n";
        
        if (@file_put_contents($infoFile, $info)) {
            $result['method'] = 'info';
            $result['success'] = true;
            $result['stdout'] = 'Created info file (full download not available)';
        } else {
            $result['method'] = 'failed';
            $result['stderr'] = 'Unable to create directory or info file';
        }
    }

    if ($result['success']) {
        echo json_encode($result);
    } else {
        http_response_code(500);
        echo json_encode($result);
    }
}

/** Check if a command exists on the server PATH */
function commandExists($cmd) {
    if (!function_exists('exec')) {
        return false;
    }
    
    $where = stripos(PHP_OS, 'WIN') === 0 ? 'where' : 'which';
    $output = [];
    $returnCode = 0;
    exec($where . ' ' . escapeshellarg($cmd) . ' 2>&1', $output, $returnCode);
    return $returnCode === 0 && !empty($output) && trim($output[0]) !== '';
}

/**
 * Serve files from downloaded repositories
 * Route: GET /test-flipboard-upload/dir-name/path/to/file
 * 
 * This allows serving downloaded HTML files and their assets
 */
function serveDownloadedFile($filePath) {
    // Security: prevent directory traversal
    $filePath = str_replace(['..', "\0"], '', $filePath);
    
    // Build full file path
    $baseDir = __DIR__ . DIRECTORY_SEPARATOR . 'test-flipboard-upload';
    $fullPath = $baseDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $filePath);
    
    // Security: ensure file is within base directory
    $realBaseDir = realpath($baseDir);
    $realFilePath = realpath($fullPath);
    
    if (!$realFilePath || strpos($realFilePath, $realBaseDir) !== 0) {
        http_response_code(404);
        echo 'File not found';
        return;
    }
    
    // Check if file exists
    if (!file_exists($realFilePath) || !is_file($realFilePath)) {
        http_response_code(404);
        echo 'File not found';
        return;
    }
    
    // Set appropriate content type
    $extension = strtolower(pathinfo($realFilePath, PATHINFO_EXTENSION));
    $contentTypes = [
        'html' => 'text/html',
        'htm' => 'text/html',
        'js' => 'application/javascript',
        'css' => 'text/css',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'otf' => 'font/otf'
    ];
    
    $contentType = $contentTypes[$extension] ?? 'application/octet-stream';
    header('Content-Type: ' . $contentType);
    
    // Read and output file
    readfile($realFilePath);
}

function logUpload($githubUrl, $repoInfo, $slackData) {
    $logFile = 'uploads.json';
    $uploads = [];
    
    // Read existing uploads
    if (file_exists($logFile)) {
        $content = file_get_contents($logFile);
        $uploads = json_decode($content, true) ?: [];
    }
    
    // Add new upload
    $upload = [
        'id' => uniqid(),
        'timestamp' => date('c'),
        'github_url' => $githubUrl,
        'repository' => $repoInfo['owner'] . '/' . $repoInfo['repo'],
        'branch' => $repoInfo['branch'],
        'path' => $repoInfo['path'],
        'slack_user' => isset($slackData['user_name']) ? $slackData['user_name'] : 'unknown',
        'slack_channel' => isset($slackData['channel_name']) ? $slackData['channel_name'] : 'unknown'
    ];
    
    array_unshift($uploads, $upload); // Add to beginning
    
    // Keep only last 6 uploads
    $uploads = array_slice($uploads, 0, 6);
    
    // Save back to file
    file_put_contents($logFile, json_encode($uploads, JSON_PRETTY_PRINT));
}

function showDashboard() {
    header('Content-Type: text/html; charset=utf-8');
    
    $uploads = getUploads();
    $totalUploads = count($uploads);
    $recentUploads = array_slice($uploads, 0, 5);
    
    echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flipboard Upload Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-card { background: #3498db; color: white; padding: 20px; border-radius: 8px; flex: 1; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; }
        .stat-label { font-size: 0.9em; opacity: 0.9; }
        .upload-item { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db; }
        .upload-repo { font-weight: bold; color: #2c3e50; font-size: 1.1em; }
        .upload-meta { color: #7f8c8d; font-size: 0.9em; margin: 5px 0; }
        .upload-link { color: #3498db; text-decoration: none; }
        .upload-link:hover { text-decoration: underline; }
        .btn { background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .btn:hover { background: #2980b9; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Flipboard Upload Dashboard</h1>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">' . $totalUploads . '</div>
                <div class="stat-label">Total Uploads</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">' . date('Y-m-d') . '</div>
                <div class="stat-label">Today</div>
            </div>
        </div>
        
        <h2>Recent Uploads</h2>';
    
    if (empty($recentUploads)) {
        echo '<p>No uploads yet. Use <code>/upload-flipboard</code> in Slack to get started!</p>';
    } else {
        foreach ($recentUploads as $upload) {
            echo '<div class="upload-item">
                <div class="upload-repo">📁 ' . htmlspecialchars($upload['repository']) . '</div>
                <div class="upload-meta">
                    🌿 Branch: ' . htmlspecialchars($upload['branch']) . ' | 
                    👤 User: ' . htmlspecialchars($upload['slack_user']) . ' | 
                    📅 ' . date('M j, Y H:i', strtotime($upload['timestamp'])) . '
                </div>
                <div><a href="' . htmlspecialchars($upload['github_url']) . '" target="_blank" class="upload-link">🔗 View on GitHub</a></div>
            </div>';
        }
    }
    
    echo '
        <a href="/api-testing/uploads" class="btn">📋 View All Uploads</a>
        <a href="/api-testing/" class="btn">🔧 API Info</a>
    </div>
</body>
</html>';
}

function showUploads() {
    header('Content-Type: application/json');
    $uploads = getUploads();
    echo json_encode([
        'total' => count($uploads),
        'uploads' => $uploads
    ], JSON_PRETTY_PRINT);
}

function getUploads() {
    $logFile = 'uploads.json';
    if (file_exists($logFile)) {
        $content = file_get_contents($logFile);
        return json_decode($content, true) ?: [];
    }
    return [];
}

function isValidGitHubUrl($url) {
    $pattern = '/^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+(?:\/tree\/[\w\-\.\/]+)?(?:\/[\w\-\.\/]*)?$/';
    return preg_match($pattern, $url);
}

function parseGitHubUrl($url) {
    $pattern = '/https:\/\/github\.com\/([\w\-\.]+)\/([\w\-\.]+)(?:\/tree\/([\w\-\.\/]+))?(?:\/(.*))?/';
    if (preg_match($pattern, $url, $matches)) {
        return [
            'owner' => $matches[1],
            'repo' => $matches[2],
            'branch' => isset($matches[3]) ? $matches[3] : 'main',
            'path' => isset($matches[4]) ? $matches[4] : ''
        ];
    }
    return null;
}
?>
