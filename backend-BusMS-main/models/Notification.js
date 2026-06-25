const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      // type: mongoose.Schema.Types.ObjectId,
      type:Number,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["Bus Arrived", "Bus Delayed", "Trip Cancelled", "General"],
      default: "General",
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Unread", "Read"],
      default: "Unread",
    },
    readAt: {
      type: Date,
      default: null,
    },
    event: {
      type: String,
      enum: ["arrival", "delay", "cancellation"],
      default: null,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
