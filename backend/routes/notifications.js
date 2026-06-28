const express = require('express');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Helper: Send Expo push notifications
const sendExpoPushNotifications = async (pushTokens, title, body, data = {}) => {
  // Filter out invalid tokens
  const validTokens = pushTokens.filter(
    (token) => token && typeof token === 'string' && token.startsWith('ExponentPushToken')
  );

  if (validTokens.length === 0) return;

  const messages = validTokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: 'default',
  }));

  try {
    // Expo allows sending up to 100 notifications at once
    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });
    }
  } catch (error) {
    console.log('Push notification error:', error.message);
  }
};

// POST /api/notifications/broadcast — Send notification to all users (admin only)
router.post('/broadcast', protect, adminOnly, async (req, res) => {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Get all users with push tokens
    const users = await User.find({
      expoPushToken: { $ne: null },
      role: 'user',
    }).select('expoPushToken');

    const tokens = users.map((u) => u.expoPushToken).filter(Boolean);

    if (tokens.length === 0) {
      return res.json({
        success: true,
        message: 'No users with push tokens found',
        sentTo: 0,
      });
    }

    await sendExpoPushNotifications(tokens, title, body, {
      type: 'broadcast',
    });

    res.json({
      success: true,
      message: `Notification sent to ${tokens.length} user(s)`,
      sentTo: tokens.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
module.exports.sendExpoPushNotifications = sendExpoPushNotifications;
