import { Request, Response, NextFunction } from 'express';

export function requireNpub(req: Request, res: Response, next: NextFunction) {
  const npub = req.headers['x-user-npub'] as string;
  if (!npub || !npub.startsWith('npub1')) {
    res.status(401).json({ error: 'Missing or invalid X-User-Npub header' });
    return;
  }
  (req as any).npub = npub;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const password = req.headers['x-admin-password'] as string;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || password !== adminPassword) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}
