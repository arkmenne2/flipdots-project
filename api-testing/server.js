const { App } = require('@slack/bolt');
const express = require('express');
const axios = require('axios');
const config = require('./config');

// Initialize Slack app
const app = new App({
    token: config.slack.botToken,
    signingSecret: config.slack.signingSecret,
    socketMode: false,
    port: config.slack.port
});

// GitHub link validation function
function isValidGitHubLink(url) {
    const githubRegex = /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+(?:\/tree\/[\w\-\.\/]+)?(?:\/[\w\-\.\/]*)?$/;
    return githubRegex.test(url);
}

// Extract repository information from GitHub URL
function parseGitHubUrl(url) {
    const match = url.match(/https:\/\/github\.com\/([\w\-\.]+)\/([\w\-\.]+)(?:\/tree\/([\w\-\.\/]+))?(?:\/(.*))?/);
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

// Handle /upload-flipboard slash command
app.command('/upload-flipboard', async ({ command, ack, respond, client }) => {
    await ack();
    
    try {
        const text = command.text.trim();
        
        // Check if the text contains a GitHub URL
        if (!text) {
            await respond({
                text: '❌ Please provide a GitHub URL. Usage: `/upload-flipboard https://github.com/user/repo`',
                response_type: 'ephemeral'
            });
            return;
        }
        
        // Extract GitHub URL from the text (handle @mentions)
        let githubUrl = text;
        if (text.startsWith('@')) {
            githubUrl = text.substring(1);
        }
        
        // Validate GitHub URL
        if (!isValidGitHubLink(githubUrl)) {
            await respond({
                text: '❌ Invalid GitHub URL. Please provide a valid GitHub repository URL.',
                response_type: 'ephemeral'
            });
            return;
        }
        
        // Parse GitHub URL
        const repoInfo = parseGitHubUrl(githubUrl);
        if (!repoInfo) {
            await respond({
                text: '❌ Could not parse GitHub URL. Please check the format.',
                response_type: 'ephemeral'
            });
            return;
        }
        
        // Send initial response
        await respond({
            text: `🔄 Processing flipboard upload from: ${githubUrl}`,
            response_type: 'in_channel'
        });
        
        // Try to fetch repository information
        let repoData = null;
        if (config.github.token) {
            try {
                const response = await axios.get(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`, {
                    headers: {
                        'Authorization': `token ${config.github.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                repoData = response.data;
            } catch (error) {
                console.log('Could not fetch repo data:', error.message);
            }
        }
        
        // Create rich message with repository information
        const blocks = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '🎮 Flipboard Upload Successful!'
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Repository:* ${repoInfo.owner}/${repoInfo.repo}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Branch:* ${repoInfo.branch}`
                    }
                ]
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*GitHub URL:* <${githubUrl}|View Repository>`
                }
            }
        ];
        
        // Add repository description if available
        if (repoData && repoData.description) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Description:* ${repoData.description}`
                }
            });
        }
        
        // Add additional repository stats if available
        if (repoData) {
            blocks.push({
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Stars:* ${repoData.stargazers_count || 0}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Language:* ${repoData.language || 'N/A'}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Last Updated:* ${new Date(repoData.updated_at).toLocaleDateString()}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Size:* ${Math.round(repoData.size / 1024)} MB`
                    }
                ]
            });
        }
        
        // Add action buttons
        blocks.push({
            type: 'actions',
            elements: [
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: '🎮 View Doom Game'
                    },
                    url: githubUrl,
                    style: 'primary'
                },
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: '📋 Copy URL'
                    },
                    value: githubUrl,
                    action_id: 'copy_url'
                }
            ]
        });
        
        // Send the detailed response
        await client.chat.postMessage({
            channel: command.channel_id,
            blocks: blocks,
            text: `Flipboard uploaded: ${githubUrl}` // Fallback text
        });
        
        console.log(`Successfully processed flipboard upload: ${githubUrl}`);
        
    } catch (error) {
        console.error('Error handling /upload-flipboard command:', error);
        await respond({
            text: '❌ An error occurred while processing your request. Please try again.',
            response_type: 'ephemeral'
        });
    }
});

// Handle button interactions
app.action('copy_url', async ({ ack, body, client }) => {
    await ack();
    
    try {
        await client.chat.postEphemeral({
            channel: body.channel.id,
            user: body.user.id,
            text: `📋 URL copied: ${body.actions[0].value}`
        });
    } catch (error) {
        console.error('Error handling copy_url action:', error);
    }
});

// Health check endpoint
app.receiver.app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint for basic server info
app.receiver.app.get('/', (req, res) => {
    res.json({ 
        message: 'Flipboard Slack API Server',
        status: 'Running',
        endpoints: {
            health: '/health',
            slack_events: '/slack/events'
        },
        timestamp: new Date().toISOString()
    });
});

// Start the app
(async () => {
    try {
        await app.start();
        console.log(`⚡️ Flipboard Slack app is running on port ${config.slack.port}!`);
        console.log(`🔗 Health check available at: http://localhost:${config.slack.port}/health`);
    } catch (error) {
        console.error('Failed to start the app:', error);
        process.exit(1);
    }
})();
