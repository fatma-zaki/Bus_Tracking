const ChatMessage = require('../models/ChatMessage');

// جلب كل رسائل الباص
exports.getBusChat = async (req, res) => {
  try {
    const { busId } = req.params;
    const messages = await ChatMessage.find({ busId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch chat messages', error: err.message });
  }
};

// إرسال رسالة جديدة
exports.sendBusChat = async (req, res) => {
  try {
    const { busId } = req.params;
    const { senderId, senderRole, message, imageUrl } = req.body;
    if (!senderId || !senderRole || (!message && !imageUrl)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const chatMsg = await ChatMessage.create({ busId, senderId, senderRole, message, imageUrl });
    res.status(201).json(chatMsg);
  } catch (err) {
    res.status(500).json({ message: 'Failed to send chat message', error: err.message });
  }
};

// تعليم كل رسائل الباص كمقروءة من قبل مستخدم معيّن
exports.markBusChatAsRead = async (req, res) => {
  try {
    const { busId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    await ChatMessage.updateMany(
      { busId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark as read', error: err.message });
  }
}; 