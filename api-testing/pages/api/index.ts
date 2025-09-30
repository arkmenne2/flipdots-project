import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({
      message: 'Flipboard Slack API Server',
      status: 'Running',
      endpoints: {
        health: '/api/health',
        slack_events: '/api/slack/events',
        dashboard: '/dashboard',
        uploads: '/api/uploads'
      },
      timestamp: new Date().toISOString()
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}


