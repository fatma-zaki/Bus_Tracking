const express = require("express");
const router = express.Router();
const {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  getRoutesByEndPoint,
  getRoutesByCurrentStation,
} = require("../controllers/routeController");
const { protect, adminOnly } = require("../middlewares/authMiddleware.js");
const authorizeRoles = require("../middlewares/authorizeRoles.js");

// Create
router.post("/", protect, authorizeRoles("admin", "manager"), createRoute);

// Get all
router.get("/", protect, getRoutes);

// Get by end_point
router.get("/end-point/:endPoint", protect, getRoutesByEndPoint);

// Get by current_station
router.get("/current-station/:currentStation", protect, getRoutesByCurrentStation);

// Get by ID
router.get("/:id", protect, getRouteById);

// Update
router.put("/:id", protect, authorizeRoles("admin", "manager"), updateRoute);

// Delete
router.delete("/:id", protect, authorizeRoles("admin", "manager"), deleteRoute);

module.exports = router;
