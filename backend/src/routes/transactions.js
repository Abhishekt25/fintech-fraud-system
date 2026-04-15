import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { processTransaction } from '../processing/pipeline.js';
import { broadcast } from '../websocket/manager.js';
import prisma from '../db/prisma.js';

const router = express.Router();

// Prisma returns Decimal objects — convert to plain numbers
function serializeTx(t) {
  return {
    ...t,
    amount:     parseFloat(t.amount),
    risk_score: parseFloat(t.risk_score),
    user_name:  t.user?.name  ?? t.user_name  ?? null,
    user_email: t.user?.email ?? t.user_email ?? null,
    user:       undefined,
  };
}

// POST /api/transactions
router.post('/', async (req, res) => {
  try {
    const { user_id, amount, merchant, category, country, device_id, ip_address } = req.body;

    if (!user_id || !amount || !merchant) {
      return res.status(400).json({ error: 'user_id, amount, merchant are required' });
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    const txData = {
      id:        req.body.id || uuidv4(),
      user_id,
      amount:    parseFloat(amount),
      merchant,
      category:  category  || 'general',
      country:   country   || 'US',
      device_id: device_id || `device-${Math.random().toString(36).substr(2, 8)}`,
      ip_address: ip_address || req.ip,
    };

    const result = await processTransaction(txData);

    if (!result.success && result.reason === 'DUPLICATE') {
      return res.status(409).json({ error: 'Duplicate transaction', transactionId: result.transactionId });
    }
    if (!result.success && result.reason === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(201).json({
      success:     true,
      transaction: result.transaction ? serializeTx(result.transaction) : null,
      reason:      result.reason,
    });
  } catch (err) {
    console.error('Transaction error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transactions
router.get('/', async (req, res) => {
  try {
    const { status, user_id, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (user_id) where.user_id = user_id;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take:    parseInt(limit),
        skip:    parseInt(offset),
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      transactions: transactions.map(serializeTx),
      total,
    });
  } catch (err) {
    console.error('List transactions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/transactions/:id/override
router.patch('/:id/override', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body;

    if (!['SAFE', 'BLOCK'].includes(action)) {
      return res.status(400).json({ error: 'action must be SAFE or BLOCK' });
    }

    const newStatus = action === 'SAFE' ? 'APPROVED' : 'BLOCKED';

    const tx = await prisma.transaction.update({
      where: { id },
      data: {
        status:           newStatus,
        analyst_override: action,
        analyst_note:     note || null,
        processed_at:     new Date(),
      },
    });

    await prisma.analystAction.create({
      data: {
        id:          uuidv4(),
        action_type: `OVERRIDE_${action}`,
        target_type: 'TRANSACTION',
        target_id:   id,
        details:     { note, newStatus },
      },
    });

    const user = await prisma.user.findUnique({ where: { id: tx.user_id } });

    broadcast('TRANSACTION_UPDATED', {
      ...serializeTx(tx),
      user_name: user?.name,
    });

    res.json({ success: true, transaction: serializeTx(tx) });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Transaction not found' });
    console.error('Override error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;