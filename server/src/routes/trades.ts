import { Router, Request, Response } from 'express';
import { requireNpub } from '../middleware/auth';
import * as q from '../db/queries';
import { broadcast } from '../ws/broadcast';

const router = Router();

router.post('/accept/:order_id', requireNpub, (req: Request, res: Response) => {
  const npub = (req as any).npub as string;
  const order_id = Number(req.params.order_id);

  const order = q.getOrderById(order_id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  if (order.poster_npub === npub) {
    res.status(409).json({ error: "You can't trade with yourself." });
    return;
  }
  if (order.status !== 'OPEN') {
    res.status(409).json({ error: 'This order was just taken. Check back for other orders.' });
    return;
  }

  const result = q.acceptOrderTransaction(order_id, order.poster_npub, npub) as any;
  if (!result.success) {
    if (result.reason === 'ORDER_TAKEN') {
      res.status(409).json({ error: 'This order was just taken. Check back for other orders.' });
    } else if (result.reason === 'ALREADY_IN_TRADE') {
      res.status(409).json({ error: "You're currently in an active trade. Finish it before starting a new one." });
    } else {
      res.status(500).json({ error: 'Could not accept order' });
    }
    return;
  }

  const trade = q.getTradeById(result.trade_id as number);
  const updatedOrder = q.getOrderById(order_id);
  broadcast({ type: 'ORDER_UPDATED', payload: updatedOrder });
  broadcast({ type: 'TRADE_UPDATED', payload: trade });
  res.status(201).json({ trade });
});

router.get('/active', requireNpub, (req: Request, res: Response) => {
  const npub = (req as any).npub as string;
  const trade = q.getActiveTradeForUser(npub);
  if (!trade) {
    res.json({ trade: null });
    return;
  }
  const order = q.getOrderById(trade.order_id);
  res.json({ trade: { ...trade, order } });
});

router.get('/:id', requireNpub, (req: Request, res: Response) => {
  const npub = (req as any).npub as string;
  const trade = q.getTradeById(Number(req.params.id));

  if (!trade) {
    res.status(404).json({ error: 'Trade not found' });
    return;
  }
  if (trade.poster_npub !== npub && trade.acceptor_npub !== npub) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const order = q.getOrderById(trade.order_id);
  res.json({ trade: { ...trade, order } });
});

router.post('/:id/confirm', requireNpub, (req: Request, res: Response) => {
  const npub = (req as any).npub as string;
  const trade_id = Number(req.params.id);

  const result = q.confirmTrade(trade_id, npub) as any;
  if (!result.success) {
    if (result.reason === 'NOT_PARTICIPANT') {
      res.status(403).json({ error: 'You are not a participant in this trade' });
    } else {
      res.status(404).json({ error: 'Trade not found or already closed' });
    }
    return;
  }

  const trade = q.getTradeById(trade_id);
  const order = q.getOrderById(trade.order_id);
  broadcast({ type: 'TRADE_UPDATED', payload: { ...trade, order } });
  res.json({ trade: { ...trade, order }, closed: result.closed });
});

router.post('/:id/dispute', requireNpub, (req: Request, res: Response) => {
  const npub = (req as any).npub as string;
  const trade_id = Number(req.params.id);
  const { reason } = req.body;

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    res.status(400).json({ error: 'Dispute reason is required' });
    return;
  }

  const trade = q.getTradeById(trade_id);
  if (!trade) {
    res.status(404).json({ error: 'Trade not found' });
    return;
  }
  if (trade.poster_npub !== npub && trade.acceptor_npub !== npub) {
    res.status(403).json({ error: 'You are not a participant in this trade' });
    return;
  }
  if (trade.status !== 'IN_PROGRESS') {
    res.status(409).json({ error: 'Trade is not in progress' });
    return;
  }

  q.createDispute(trade_id, npub, reason.trim());
  const updated = q.getTradeById(trade_id);
  const order = q.getOrderById(updated.order_id);
  broadcast({ type: 'TRADE_UPDATED', payload: { ...updated, order } });
  res.json({ success: true });
});

export default router;
