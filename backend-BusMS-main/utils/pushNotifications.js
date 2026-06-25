// utils/pushNotifications.js

const admin = require("firebase-admin");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();
// تحميل ملف إعدادات Firebase من .env
console.log("TEST:", process.env.FIREBASE_CONFIG_PATH);


const serviceAccount = require(path.resolve(process.env.FIREBASE_CONFIG_PATH));

// تهيئة Firebase Admin مرة واحدة فقط
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// إرسال الإشعار
const sendPushNotification = async (token, title, message) => {
  const payload = {
    notification: {
      title,
      body: message,
    },
  };

  try {
    const response = await admin.messaging().sendToDevice(token, payload);
    console.log("Push notification sent:", response);
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

module.exports = {
  sendPushNotification,
};
