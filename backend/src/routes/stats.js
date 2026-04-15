import express from 'express';
import { getSessionStats } from '../processing/pipeline.js';
import prisma from '../db/prisma.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const session = getSessionStats();

    const [txAgg, highRisk, frozen] = await Promise.all([
      prisma.transaction.groupBy({
        by:    ['status'],
        _count: { id: true },
        _sum:   { amount: true },
      }),
      prisma.user.count({ where: { risk_score: { gte: 70 } } }),
      prisma.user.count({ where: { is_frozen: true } }),
    ]);

    const byStatus    = Object.fromEntries(txAgg.map(r => [r.status, r._count.id]));
    const total       = Object.values(byStatus).reduce((a, b) => a + b, 0);
    const totalVolume = txAgg.reduce((s, r) => s + parseFloat(r._sum.amount || 0), 0);

    res.json({
      session,
      all_time: {
        total,
        flagged:      byStatus['FLAGGED']  || 0,
        blocked:      byStatus['BLOCKED']  || 0,
        approved:     byStatus['APPROVED'] || 0,
        total_volume: totalVolume,
        flag_rate:    total > 0
          ? Math.round(((byStatus['FLAGGED'] || 0) + (byStatus['BLOCKED'] || 0)) / total * 100)
          : 0,
      },
      users: { high_risk: highRisk, frozen },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;