import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { setUserFrozen } from '../state/userState.js';
import { broadcast } from '../websocket/manager.js';
import prisma from '../db/prisma.js';

const router = express.Router();

function serializeUser(u) {
  return {
    ...u,
    risk_score:   parseFloat(u.risk_score   || 0),
    total_volume: parseFloat(u.total_volume || 0),
  };
}

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const { sort = 'risk_score', order = 'DESC', limit = 100 } = req.query;
    const validSorts = ['risk_score', 'name', 'total_transactions', 'total_volume', 'created_at'];
    const sortCol = validSorts.includes(sort) ? sort : 'risk_score';

    const users = await prisma.user.findMany({
      orderBy: { [sortCol]: order === 'ASC' ? 'asc' : 'desc' },
      take: parseInt(limit),
    });

    res.json({ users: users.map(serializeUser) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const recent_transactions = await prisma.transaction.findMany({
      where:   { user_id: req.params.id },
      orderBy: { created_at: 'desc' },
      take:    20,
    });

    res.json({
      user: serializeUser(user),
      recent_transactions: recent_transactions.map(t => ({
        ...t,
        amount:     parseFloat(t.amount),
        risk_score: parseFloat(t.risk_score),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });

    const user = await prisma.user.create({
      data: { id: uuidv4(), name, email },
    });

    broadcast('USER_CREATED', serializeUser(user));
    res.status(201).json({ user: serializeUser(user) });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/freeze
router.patch('/:id/freeze', async (req, res) => {
  try {
    const { frozen } = req.body;
    if (typeof frozen !== 'boolean') return res.status(400).json({ error: 'frozen must be boolean' });

    await setUserFrozen(req.params.id, frozen);

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.analystAction.create({
      data: {
        id:          uuidv4(),
        action_type: frozen ? 'FREEZE_ACCOUNT' : 'UNFREEZE_ACCOUNT',
        target_type: 'USER',
        target_id:   req.params.id,
        details:     {},
      },
    });

    broadcast('USER_UPDATED', serializeUser(user));
    res.json({ success: true, user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/reset-risk
router.patch('/:id/reset-risk', async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data:  { risk_score: 0 },
    });

    await prisma.analystAction.create({
      data: {
        id:          uuidv4(),
        action_type: 'RESET_RISK',
        target_type: 'USER',
        target_id:   req.params.id,
        details:     {},
      },
    });

    broadcast('USER_UPDATED', serializeUser(user));
    res.json({ success: true, user: serializeUser(user) });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    res.status(500).json({ error: err.message });
  }
});

export default router;