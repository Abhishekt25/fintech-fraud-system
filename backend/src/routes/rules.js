import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { invalidateRuleCache } from '../rules/engine.js';
import { broadcast } from '../websocket/manager.js';
import prisma from '../db/prisma.js';

const router = express.Router();

// GET /api/rules
router.get('/', async (req, res) => {
  try {
    const rules = await prisma.rule.findMany({ orderBy: { priority: 'desc' } });
    res.json({ rules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rules
router.post('/', async (req, res) => {
  try {
    const { name, description, priority, action, weight, logic, conditions } = req.body;

    if (!name || !action || !conditions) {
      return res.status(400).json({ error: 'name, action, and conditions are required' });
    }
    if (!['FLAG', 'BLOCK', 'ALLOW'].includes(action)) {
      return res.status(400).json({ error: 'action must be FLAG, BLOCK, or ALLOW' });
    }
    if (!Array.isArray(conditions) || conditions.length === 0) {
      return res.status(400).json({ error: 'conditions must be a non-empty array' });
    }

    const rule = await prisma.rule.create({
      data: {
        id: uuidv4(),
        name,
        description: description || '',
        priority: parseInt(priority || 50),
        action,
        weight: parseInt(weight || 10),
        logic: logic || 'AND',
        conditions,
      },
    });

    invalidateRuleCache();
    broadcast('RULE_UPDATED', rule);
    res.status(201).json({ rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/rules/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, description, priority, action, weight, logic, conditions, is_active } = req.body;

    const data = {};
    if (name !== undefined)        data.name = name;
    if (description !== undefined) data.description = description;
    if (priority !== undefined)    data.priority = parseInt(priority);
    if (action !== undefined)      data.action = action;
    if (weight !== undefined)      data.weight = parseInt(weight);
    if (logic !== undefined)       data.logic = logic;
    if (conditions !== undefined)  data.conditions = conditions;
    if (is_active !== undefined)   data.is_active = is_active;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const rule = await prisma.rule.update({
      where: { id: req.params.id },
      data,
    });

    invalidateRuleCache();
    broadcast('RULE_UPDATED', rule);
    res.json({ rule });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Rule not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rules/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.rule.delete({ where: { id: req.params.id } });
    invalidateRuleCache();
    broadcast('RULE_DELETED', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Rule not found' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/rules/:id/toggle
router.patch('/:id/toggle', async (req, res) => {
  try {
    const existing = await prisma.rule.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Rule not found' });

    const rule = await prisma.rule.update({
      where: { id: req.params.id },
      data: { is_active: !existing.is_active },
    });

    invalidateRuleCache();
    broadcast('RULE_UPDATED', rule);
    res.json({ rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;