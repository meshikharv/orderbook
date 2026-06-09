import { Router, Request, Response } from 'express';
import { requireNpub } from '../middleware/auth';
import * as q from '../db/queries';
import { Currency } from '../../../shared/types';

const router = Router();

router.get('/me', requireNpub, (req: Request, res: Response) => {
  const npub = (req as any).npub as string;
  const user = q.getUserByNpub(npub);
  if (!user) {
    res.status(404).json({ exists: false });
    return;
  }
  res.json({ exists: true, user });
});

router.post('/onboard', requireNpub, (req: Request, res: Response) => {
  const npub = (req as any).npub as string;
  const { fedi_username, country, preferred_currency } = req.body;

  if (!fedi_username || typeof fedi_username !== 'string' || fedi_username.trim().length === 0) {
    res.status(400).json({ error: 'fedi_username is required' });
    return;
  }
  const validCurrencies: Currency[] = ['INR', 'USD', 'EUR', 'KES', 'PHP'];
  if (!validCurrencies.includes(preferred_currency)) {
    res.status(400).json({ error: 'Invalid preferred_currency' });
    return;
  }

  const existing = q.getUserByNpub(npub);
  if (existing) {
    q.updateUser(npub, fedi_username.trim(), country || 'IN', preferred_currency);
  } else {
    q.createUser(npub, fedi_username.trim(), country || 'IN', preferred_currency);
  }
  const user = q.getUserByNpub(npub);
  res.json({ user });
});

export default router;
