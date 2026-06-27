const admin = require("firebase-admin");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

let firebaseInitialized = false;

try {
  if (process.env.FIREBASE_CONFIG_PATH) {
    const serviceAccount = require(path.resolve(process.env.FIREBASE_CONFIG_PATH));
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    firebaseInitialized = true;
  }
} catch (error) {
  console.warn("Firebase not configured — push notifications disabled:", error.message);
}

const sendPushNotification = async (token, title, message) => {
  if (!firebaseInitialized) {
    console.warn("Push notification skipped — Firebase not configured");
    return;
  }

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