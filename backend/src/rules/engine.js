import prisma from '../db/prisma.js';

let ruleCache = [];
let lastCacheTime = 0;
const CACHE_TTL = 5000;

export async function loadRules(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && ruleCache.length > 0 && now - lastCacheTime < CACHE_TTL) {
    return ruleCache;
  }
  ruleCache = await prisma.rule.findMany({
    where: { is_active: true },
    orderBy: { priority: 'desc' },
  });
  lastCacheTime = now;
  return ruleCache;
}

export function invalidateRuleCache() {
  ruleCache = [];
  lastCacheTime = 0;
}

function evaluateCondition(field, operator, value, context) {
  const parts = field.split('.');
  const source = parts[0];
  const fieldName = parts[1];

  let actual;
  if (source === 'transaction') {
    actual = context.transaction[fieldName];
  } else if (source === 'user') {
    actual = context.userStats[fieldName] ?? context.user?.[fieldName];
  } else {
    return false;
  }

  if (actual === undefined || actual === null) return false;

  switch (operator) {
    case 'eq':          return actual == value;
    case 'neq':         return actual != value;
    case 'gt':          return Number(actual) > Number(value);
    case 'gte':         return Number(actual) >= Number(value);
    case 'lt':          return Number(actual) < Number(value);
    case 'lte':         return Number(actual) <= Number(value);
    case 'in':          return Array.isArray(value) && value.includes(actual);
    case 'not_in':      return Array.isArray(value) && !value.includes(actual);
    case 'contains':    return String(actual).toLowerCase().includes(String(value).toLowerCase());
    case 'starts_with': return String(actual).toLowerCase().startsWith(String(value).toLowerCase());
    default:            return false;
  }
}

export async function evaluateTransaction(transaction, user, userStats) {
  const rules = await loadRules();
  const context = { transaction, user, userStats };

  let totalWeight = 0;
  const matchedRules = [];
  let finalAction = 'APPROVED';

  for (const rule of rules) {
    const conditions = Array.isArray(rule.conditions)
      ? rule.conditions
      : JSON.parse(rule.conditions || '[]');

    if (!conditions.length) continue;

    const ruleMatched = rule.logic === 'OR'
      ? conditions.some(c => evaluateCondition(c.field, c.operator, c.value, context))
      : conditions.every(c => evaluateCondition(c.field, c.operator, c.value, context));

    if (ruleMatched) {
      matchedRules.push({
        id: rule.id,
        name: rule.name,
        action: rule.action,
        weight: rule.weight,
        priority: rule.priority,
      });
      totalWeight += rule.weight;
      if (rule.action === 'BLOCK') finalAction = 'BLOCKED';
      else if (rule.action === 'FLAG' && finalAction !== 'BLOCKED') finalAction = 'FLAGGED';
    }
  }

  return {
    status: finalAction,
    riskScore: Math.min(100, totalWeight),
    matchedRules,
  };
}

export function computeUserRiskScore(currentScore, newTxRiskScore, action) {
  let updated = currentScore * 0.7 + newTxRiskScore * 0.3;
  if (action === 'APPROVED') updated = Math.max(0, updated - 0.5);
  return Math.min(100, Math.max(0, Math.round(updated * 100) / 100));
}