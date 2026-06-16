const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  senderId: { type: String, required: true },
  senderName: { type: String, default: 'Unknown' },
  senderRole: { type: String, enum: ['user', 'admin'], default: 'user' },
  timestamp: { type: Date, default: Date.now },
  expiresAt: { type: Number, default: null }, // epoch ms for user message auto-hide
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  userName: {
    type: String,
    default: 'Student',
  },
  userEmail: {
    type: String,
    default: '',
  },
  messages: [messageSchema],
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageTime: {
    type: Date,
    default: Date.now,
  },
  unreadByAdmin: {
    type: Number,
    default: 0,
  },
  unreadByUser: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Conversation', conversationSchema);
