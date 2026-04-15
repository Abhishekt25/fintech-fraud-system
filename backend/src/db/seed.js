import prisma from './prisma.js';

const defaultRules = [
  {
    id: 'rule-001', name: 'Already High Risk User',
    description: 'Auto-block all transactions for users with critical risk scores',
    priority: 100, action: 'BLOCK', weight: 10, logic: 'AND',
    conditions: [{ field: 'user.risk_score', operator: 'gte', value: 80 }],
  },
  {
    id: 'rule-002', name: 'High Risk Country',
    description: 'Block transactions from high-risk jurisdictions',
    priority: 95, action: 'BLOCK', weight: 50, logic: 'AND',
    conditions: [{ field: 'transaction.country', operator: 'in', value: ['NK', 'IR', 'CU', 'SY', 'VE'] }],
  },
  {
    id: 'rule-003', name: 'High Velocity - 1h Window',
    description: 'Flag users making more than 10 transactions per hour',
    priority: 90, action: 'FLAG', weight: 25, logic: 'AND',
    conditions: [{ field: 'user.transactions_last_hour', operator: 'gt', value: 10 }],
  },
  {
    id: 'rule-004', name: 'Multi-Country Rapid Travel',
    description: 'Flag if user transacts from 3+ countries within 1 hour',
    priority: 85, action: 'FLAG', weight: 30, logic: 'AND',
    conditions: [{ field: 'user.countries_last_hour', operator: 'gte', value: 3 }],
  },
  {
    id: 'rule-005', name: 'Large Transaction Alert',
    description: 'Flag transactions above $5,000 for review',
    priority: 80, action: 'FLAG', weight: 20, logic: 'AND',
    conditions: [{ field: 'transaction.amount', operator: 'gt', value: 5000 }],
  },
  {
    id: 'rule-006', name: 'Multiple Device Usage',
    description: 'Flag users using 4+ devices within 1 hour',
    priority: 75, action: 'FLAG', weight: 20, logic: 'AND',
    conditions: [{ field: 'user.devices_last_hour', operator: 'gte', value: 4 }],
  },
  {
    id: 'rule-007', name: 'Large Volume 24h',
    description: 'Flag users with $20,000+ in transaction volume in 24 hours',
    priority: 75, action: 'FLAG', weight: 20, logic: 'AND',
    conditions: [{ field: 'user.volume_last_24h', operator: 'gte', value: 20000 }],
  },
  {
    id: 'rule-008', name: 'Suspicious Category',
    description: 'Flag transactions in high-risk merchant categories',
    priority: 70, action: 'FLAG', weight: 15, logic: 'AND',
    conditions: [{ field: 'transaction.category', operator: 'in', value: ['crypto', 'gambling', 'adult', 'weapons'] }],
  },
];

export async function seedDefaultRules() {
  const count = await prisma.rule.count();
  if (count === 0) {
    await prisma.rule.createMany({ data: defaultRules });
    console.log('✓ Default rules seeded');
  }
}