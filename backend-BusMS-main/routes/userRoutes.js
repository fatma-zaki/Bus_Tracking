const express = require("express");
const uploadImg = require("../middlewares/upload.js");
const {protect} = require("../middlewares/authMiddleware.js");
const authorizeRoles = require("../middlewares/authorizeRoles.js")
const { loginLimiter } = require('../middlewares/rateLimiter');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  getStudentsByParent,
  getStudentWithParent,
  updateUser,
  uploadProfileImage,
  deleteUser,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  addChildToParent,
  getChildrenForParent,
  deleteChildFromParent,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  getAllDrivers,
  updateChildForParent
} = require("../controllers/userController");

// register new user (with image upload)
router.post("/register", uploadImg.single("image"), registerUser);

// register new user (without image - fallback)
router.post("/register-simple", registerUser);

// Login
router.post("/login", loginUser);

// Email verification
router.get('/verify-email', verifyEmail);

// Request password reset
router.post('/request-password-reset', requestPasswordReset);

// Reset password
router.post('/reset-password', resetPassword);

// Get All users
router.get("/", protect, authorizeRoles("admin", "manager"), getAllUsers);
router.get('/drivers', protect, getAllDrivers);

// Get current user profile
router.get('/me',protect, getCurrentUser);
// Update current user profile
router.patch('/me', protect, updateCurrentUser);
// Change password
router.patch('/change-password', protect, changePassword);
// Parent adds a new child
router.post('/me/children', protect, addChildToParent);
// Parent fetches all their children
router.get('/me/children', protect, getChildrenForParent);
router.delete('/children/:childId', protect, deleteChildFromParent);
// Parent updates their own child
router.patch('/me/children/:childId', protect, updateChildForParent);

// Get user by Id
router.get('/:id',protect, authorizeRoles('admin' ,'parent'), getUserById);
// one parent his students
router.get('/parent/:parentId/students', getStudentsByParent);
// get student with his parents data
router.get('/student/:id/with-parent', getStudentWithParent);
// update user one field or two fiels
router.patch('/:id', protect, authorizeRoles('admin'), updateUser);
// delete user using id by admin
router.delete('/:id', protect, authorizeRoles('admin'), deleteUser);
// upload image
router.patch('/upload-profile-image', protect, uploadImg.single('image'), uploadProfileImage);

// في userRoutes.js

module.exports = router;
