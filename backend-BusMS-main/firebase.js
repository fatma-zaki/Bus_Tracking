


const admin = require("firebase-admin");
const path = require("path");

// تحميل ملف Firebase service account
const serviceAccount = require(path.join(__dirname, process.env.FIREBASE_CONFIG_PATH));

 
// تهيئة Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log("Firebase initialized...");




