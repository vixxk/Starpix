const clients = new Map(); // userId string -> Set of { res, req }

/**
 * Handle incoming SSE connection for real-time credit balance streaming
 */
const handleBalanceSSEConnection = async (req, res) => {
  const userId = req.user._id.toString();

  // Set SSE response headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  });

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  // Register client
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  const clientSet = clients.get(userId);
  const clientObj = { res, req };
  clientSet.add(clientObj);

  console.log(`[Balance SSE] Client connected for user ${userId}. Total active connections: ${clientSet.size}`);

  // Fetch current user and calculate credit transaction totals
  const User = require('../models/User');
  const CreditTransaction = require('../models/CreditTransaction');
  let currentCredits = req.user.credits !== undefined ? req.user.credits : 240;
  let totalBought = 0;
  let totalSpent = 0;

  try {
    const transactions = await CreditTransaction.find({ userId: req.user._id }).lean();
    totalBought = transactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    totalSpent = transactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  } catch (err) {
    console.warn('[Balance SSE] Error calculating initial totals:', err.message);
  }

  // Send initial balance event immediately upon connection
  const initialPayload = {
    type: 'balance_update',
    credits: currentCredits,
    totalBought,
    totalSpent,
    reason: 'connected',
    timestamp: Date.now(),
  };

  try {
    res.write(`data: ${JSON.stringify(initialPayload)}\n\n`);
  } catch (err) {
    console.warn('[Balance SSE] Error sending initial payload:', err.message);
  }

  // Heartbeat keep-alive ping every 25 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    clientSet.delete(clientObj);
    if (clientSet.size === 0) {
      clients.delete(userId);
    }
    console.log(`[Balance SSE] Client disconnected for user ${userId}. Remaining connections: ${clientSet.size}`);
  });
};

/**
 * Broadcast balance update to all active SSE connections for a specific user
 */
const broadcastBalanceUpdate = async (userId, customData = {}) => {
  if (!userId) return;
  const uId = userId.toString();
  const clientSet = clients.get(uId);
  if (!clientSet || clientSet.size === 0) return;

  try {
    const User = require('../models/User');
    const CreditTransaction = require('../models/CreditTransaction');

    let credits = customData.credits;
    if (credits === undefined) {
      const user = await User.findById(uId).select('credits').lean();
      credits = user?.credits !== undefined ? user.credits : 240;
    }

    let totalBought = customData.totalBought;
    let totalSpent = customData.totalSpent;
    if (totalBought === undefined || totalSpent === undefined) {
      const transactions = await CreditTransaction.find({ userId: uId }).lean();
      totalBought = transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      totalSpent = transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    }

    const payload = {
      type: 'balance_update',
      credits: Number(credits),
      totalBought: Number(totalBought),
      totalSpent: Number(totalSpent),
      reason: customData.reason || 'updated',
      timestamp: Date.now(),
    };

    const sseMessage = `data: ${JSON.stringify(payload)}\n\n`;
    console.log(`[Balance SSE] Broadcasting to ${clientSet.size} client(s) for user ${uId}:`, payload);

    for (const client of clientSet) {
      try {
        client.res.write(sseMessage);
      } catch (writeErr) {
        console.warn('[Balance SSE] Error writing to client stream:', writeErr.message);
      }
    }
  } catch (err) {
    console.error('[Balance SSE] Broadcast error:', err.message);
  }
};

module.exports = {
  handleBalanceSSEConnection,
  broadcastBalanceUpdate,
};
