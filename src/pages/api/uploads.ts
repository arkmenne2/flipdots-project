import { NextApiRequest, NextApiResponse } from 'next';
import { getUploads } from '@/lib/storage/uploads';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      console.log('GET /api/uploads called');
      const uploads = getUploads();
      console.log(`Returning ${uploads.length} uploads`);
      res.status(200).json({
        total: uploads.length,
        uploads: uploads
      });
    } catch (error) {
      console.error('Error in /api/uploads:', error);
      res.status(500).json({
        error: 'Failed to fetch uploads',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}


