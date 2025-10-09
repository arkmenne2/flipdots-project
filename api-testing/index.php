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
        
    default:
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
