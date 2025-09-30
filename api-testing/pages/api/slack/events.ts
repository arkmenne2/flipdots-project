import { NextApiRequest, NextApiResponse } from 'next';
import { isValidGitHubUrl, parseGitHubUrl } from '../../../lib/github';
import { logUpload } from '../../../lib/uploads';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    // Log the request for debugging
    console.log('Slack request:', data);
    
    // Check if it's a slash command
    if (!data.command || data.command !== '/upload-flipboard') {
      return res.status(200).json({ text: 'Unknown command' });
    }
    
    const text = (data.text || '').trim();
    
    // Validate GitHub URL
    if (!text) {
      return res.status(200).json({
        text: '❌ Please provide a GitHub URL. Usage: `/upload-flipboard https://github.com/user/repo`',
        response_type: 'ephemeral'
      });
    }
    
    // Handle @mention format
    let githubUrl = text;
    if (text.startsWith('@')) {
      githubUrl = text.substring(1);
    }
    
    // Validate GitHub URL
    if (!isValidGitHubUrl(githubUrl)) {
      return res.status(200).json({
        text: '❌ Invalid GitHub URL. Please provide a valid GitHub repository URL.',
        response_type: 'ephemeral'
      });
    }
    
    // Parse GitHub URL
    const repoInfo = parseGitHubUrl(githubUrl);
    if (!repoInfo) {
      return res.status(200).json({
        text: '❌ Could not parse GitHub URL. Please check the format.',
        response_type: 'ephemeral'
      });
    }
    
    // Create response
    const response = {
      text: '🎮 Flipboard Upload Successful!',
      blocks: [
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
        },
        {
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
            }
          ]
        }
      ]
    };
    
    // Log the upload
    logUpload(githubUrl, repoInfo, {
      user_name: data.user_name,
      channel_name: data.channel_name
    });
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Error handling Slack event:', error);
    res.status(200).json({
      text: '❌ An error occurred while processing your request. Please try again.',
      response_type: 'ephemeral'
    });
  }
}

