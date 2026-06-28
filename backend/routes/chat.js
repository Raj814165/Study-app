const express = require('express');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { sendExpoPushNotifications } = require('./notifications');

const router = express.Router();

const MESSAGE_LIFETIME_MS = 10000; // 10 seconds for user messages

// GET /api/chat/conversations — All conversations (admin only)
router.get('/conversations', protect, adminOnly, async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ lastMessageTime: -1 });
    const mapped = conversations.map((c) => {
      const obj = c.toObject();
      obj.id = obj._id.toString();
      return obj;
    });
    res.json({ success: true, conversations: mapped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/chat/my — Get current user's conversation
router.get('/my', protect, async (req, res) => {
  try {
    let conversation = await Conversation.findOne({ userId: req.user._id.toString() });

    if (!conversation) {
      conversation = await Conversation.create({
        userId: req.user._id.toString(),
        userName: req.user.name,
        userEmail: req.user.email,
        messages: [],
      });
    }

    const obj = conversation.toObject();
    obj.id = obj._id.toString();
    res.json({ success: true, conversation: obj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chat/send — Send a message
router.post('/send', protect, async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    // If no conversationId, find or create by userId
    if (!conversation) {
      const targetUserId = req.body.targetUserId || req.user._id.toString();
      conversation = await Conversation.findOne({ userId: targetUserId });

      if (!conversation) {
        conversation = await Conversation.create({
          userId: targetUserId,
          userName: req.user.name,
          userEmail: req.user.email,
          messages: [],
        });
      }
    }

    const isAdmin = req.user.role === 'admin';

    const newMessage = {
      text: text.trim(),
      senderId: req.user._id.toString(),
      senderName: req.user.name,
      senderRole: req.user.role,
      timestamp: new Date(),
      expiresAt: !isAdmin ? Date.now() + MESSAGE_LIFETIME_MS : null,
    };

    conversation.messages.push(newMessage);
    conversation.lastMessage = text.trim();
    conversation.lastMessageTime = new Date();

    if (isAdmin) {
      conversation.unreadByUser += 1;
      conversation.unreadByAdmin = 0;
    } else {
      conversation.unreadByAdmin += 1;
      conversation.unreadByUser = 0;
    }

    await conversation.save();

    const savedMsg = conversation.messages[conversation.messages.length - 1];

    // Send push notifications
    try {
      if (isAdmin) {
        // Admin sent message → notify the user
        const targetUser = await User.findById(conversation.userId).select('expoPushToken');
        if (targetUser?.expoPushToken) {
          sendExpoPushNotifications(
            [targetUser.expoPushToken],
            'New message from Support Team',
            text.trim().substring(0, 100),
            { type: 'chat', conversationId: conversation._id.toString() }
          );
        }
      } else {
        // User sent message → notify all admins
        const admins = await User.find({ role: 'admin', expoPushToken: { $ne: null } }).select('expoPushToken');
        const adminTokens = admins.map((a) => a.expoPushToken).filter(Boolean);
        if (adminTokens.length > 0) {
          sendExpoPushNotifications(
            adminTokens,
            `New message from ${req.user.name}`,
            text.trim().substring(0, 100),
            { type: 'chat', conversationId: conversation._id.toString(), userName: req.user.name }
          );
        }
      }
    } catch (pushError) {
      console.log('Push notification error (non-fatal):', pushError.message);
    }

    res.json({
      success: true,
      message: {
        id: savedMsg._id.toString(),
        text: savedMsg.text,
        senderId: savedMsg.senderId,
        senderName: savedMsg.senderName,
        senderRole: savedMsg.senderRole,
        timestamp: savedMsg.timestamp.toISOString(),
        expiresAt: savedMsg.expiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/chat/read/:id — Mark conversation as read
router.put('/read/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isAdmin = req.user.role === 'admin';
    if (isAdmin) {
      conversation.unreadByAdmin = 0;
    } else {
      conversation.unreadByUser = 0;
    }

    await conversation.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/chat/:id — Delete a conversation
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndDelete(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
