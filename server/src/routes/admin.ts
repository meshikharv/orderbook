import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth';
import * as q from '../db/queries';

const router = Router();

router.use(requireAdmin);

router.get('/stats', (_req: Request, res: Response) => {
  res.json(q.getAdminStats());
});

router.get('/disputes', (_req: Request, res: Response) => {
  res.json({ disputes: q.getOpenDisputes() });
});

router.post('/disputes/:id/rule', (req: Request, res: Response) => {
  const { ruling, ruling_notes, penalized_npub } = req.body;
  if (!ruling) {
    res.status(400).json({ error: 'ruling is required' });
    return;
  }
  const result = q.resolveDispute(Number(req.params.id), ruling, ruling_notes || '', penalized_npub || '') as any;
  if (!result.success) {
    res.status(404).json({ error: 'Dispute not found' });
    return;
  }
  res.json({ success: true });
});

router.get('/users', (_req: Request, res: Response) => {
  res.json({ users: q.getAllUsers() });
});

router.post('/users/:npub/trust', (req: Request, res: Response) => {
  const { delta, reason } = req.body;
  if (delta === undefined || isNaN(Number(delta))) {
    res.status(400).json({ error: 'delta must be a number' });
    return;
  }
  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    res.status(400).json({ error: 'reason is required' });
    return;
  }
  q.adjustTrustScore(req.params.npub, Number(delta), reason.trim());
  res.json({ success: true });
});

router.get('/trades', (req: Request, res: Response) => {
  const { status } = req.query as { status?: string };
  res.json({ trades: q.getAllTradesAdmin(status) });
});

router.get('/orders', (req: Request, res: Response) => {
  const { status } = req.query as { status?: string };
  res.json({ orders: q.getAllOrdersAdmin(status) });
});

export default router;
