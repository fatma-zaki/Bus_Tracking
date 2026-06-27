const admin = require("firebase-admin");
const path = require("path");

try {
  if (process.env.FIREBASE_CONFIG_PATH) {
    const serviceAccount = require(path.join(__dirname, process.env.FIREBASE_CONFIG_PATH));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase initialized...");
  } else {
    console.warn("Firebase not configured — FIREBASE_CONFIG_PATH not set");
  }
} catch (error) {
  console.warn("Firebase initialization failed:", error.message);
}