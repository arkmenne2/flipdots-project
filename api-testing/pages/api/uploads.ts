import { NextApiRequest, NextApiResponse } from 'next';
import { getUploads } from '../../lib/uploads';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const uploads = getUploads();
    res.status(200).json({
      total: uploads.length,
      uploads: uploads
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}


