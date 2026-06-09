import { Router, Request, Response } from 'express';
import { requireNpub } from '../middleware/auth';
import * as q from '../db/queries';
import { broadcast } from '../ws/broadcast';
import { Currency, OrderType } from '../../../shared/types';

const router = Router();

router.get('/', requireNpub, (req: Request, res: Response) => {
  const { currency, type } = req.query as { currency?: string; type?: string };
  const orders = q.getOpenOrders(currency, type);
  res.json({ orders });
});

router.post('/', requireNpub, (req: Request, res: Response) => {
  const npub = (req as any).npub as string;

  const user = q.getUserByNpub(npub);
  if (!user) {
    res.status(403).json({ error: 'User not found. Please complete onboarding first.' });
    return;
  }

  if (q.hasActiveOrder(npub)) {
    res.status(409).json({
      error: 'You have an active trade in progress. Both parties must close it before you can post a new order.',
    });
    return;
  }

  const { type, btc_amount, price_per_btc, currency, notes } = req.body;

  const validTypes: OrderType[] = ['BUY', 'SELL'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: 'type must be BUY or SELL' });
    return;
  }
  if (!btc_amount || isNaN(Number(btc_amount)) || Number(btc_amount) <= 0) {
    res.status(400).json({ error: 'btc_amount must be a positive number' });
    return;
  }
  if (!price_per_btc || isNaN(Number(price_per_btc)) || Number(price_per_btc) <= 0) {
    res.status(400).json({ error: 'price_per_btc must be a positive number' });
    return;
  }
  const validCurrencies: Currency[] = ['INR', 'USD', 'EUR', 'KES', 'PHP'];
  if (!validCurrencies.includes(currency)) {
    res.status(400).json({ error: 'Invalid currency' });
    return;
  }

  const result = q.createOrder(npub, type, Number(btc_amount), Number(price_per_btc), currency, notes);
  const order = q.getOrderById(result.lastInsertRowid as number);
  broadcast({ type: 'ORDER_CREATED', payload: order });
  res.status(201).json({ order });
});

router.delete('/:id', requireNpub, (req: Request, res: Response) => {
  const npub = (req as any).npub as string;
  const order = q.getOrderById(Number(req.params.id));

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  if (order.poster_npub !== npub) {
    res.status(403).json({ error: 'You can only cancel your own orders' });
    return;
  }
  if (order.status !== 'OPEN') {
    res.status(409).json({ error: 'Only OPEN orders can be cancelled' });
    return;
  }

  q.updateOrderStatus(order.id, 'CANCELLED');
  const updated = q.getOrderById(order.id);
  broadcast({ type: 'ORDER_UPDATED', payload: updated });
  res.json({ success: true });
});

export default router;
