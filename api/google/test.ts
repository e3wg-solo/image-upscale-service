import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  return res.status(200).json({ 
    message: 'Serverless function is working!',
    method: req.method,
    url: req.url,
    query: req.query,
    timestamp: new Date().toISOString()
  });
}
