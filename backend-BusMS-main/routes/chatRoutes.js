const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

// جلب كل رسائل الباص
router.get('/:busId', protect, chatController.getBusChat);
// إرسال رسالة جديدة
router.post('/:busId', protect, chatController.sendBusChat);
// تعليم كل رسائل الباص كمقروءة من قبل مستخدم معيّن
router.patch('/:busId/read', protect, chatController.markBusChatAsRead);

module.exports = router; 