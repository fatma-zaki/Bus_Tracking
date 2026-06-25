const express = require("express");
const router = express.Router();
const {
  getLastLocation, 
  createTracking, 
  getAllActiveBuses, 
  getTrackingHistory
} = require("../controllers/trackingController");

// Create new tracking location
router.post("/create", createTracking);

// Get last location of specific bus
router.get("/bus/:id", getLastLocation);

// Get all active buses with their latest locations
router.get("/active-buses", getAllActiveBuses);

// Get tracking history for a specific bus
router.get("/bus/:id/history", getTrackingHistory);

module.exports = router;


