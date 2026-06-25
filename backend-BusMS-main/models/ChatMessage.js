const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatMessageSchema = new Schema({
  busId: { type: Schema.Types.ObjectId, ref: 'Bus', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['parent', 'driver', 'admin', 'student'], required: true },
  message: { type: String, required: true },
  imageUrl: { type: String }, // رابط الصورة إذا وجدت
  createdAt: { type: Date, default: Date.now },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }], // المستخدمون الذين قرأوا الرسالة
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema); 