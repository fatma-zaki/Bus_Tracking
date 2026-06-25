
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bus-ms-profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'fill' }]
  }
});

const upload = multer({ storage: storage });

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phone, licenseNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate required fields based on role
    if (role === 'driver' && (!phone || !licenseNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and license number are required for drivers'
      });
    }

    // Handle profile image if uploaded
    let profileImage = '';
    if (req.file) {
      // For local storage, just use the file path
      profileImage = req.file.path;
    }

    // Create user
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role,
      phone: role === 'driver' ? phone : undefined,
      licenseNumber: role === 'driver' ? licenseNumber : undefined
    };

    if (profileImage) {
      userData.profileImage = profileImage;
    }

    const user = await User.create(userData);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    await user.save();

    // Send verification email (temporarily disabled for development)
    // const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    // const emailMessage = `
    //   Welcome to Bus Management System!
    //   
    //   Please verify your email by clicking the following link:
    //   ${verificationUrl}
    //   
    //   If you didn't create this account, please ignore this email.
    // `;

    // try {
    //   await sendEmail({
    //     to: user.email,
    //     subject: 'Email Verification - Bus Management System',
    //     text: emailMessage
    //   });
    // } catch (emailError) {
    //   console.error('Email sending failed:', emailError);
    //   // Continue with registration even if email fails
    // }

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          isEmailVerified: user.isEmailVerified
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified (optional - you can remove this if not needed)
    // Temporarily disabled for development
    // if (!user.isEmailVerified) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Please verify your email before logging in'
    //   });
    // }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          isEmailVerified: user.isEmailVerified
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// @desc    Get all users (with pagination and filtering)
// @route   GET /api/users
// @access  Private (Admin and Manager)
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    // إذا كان المستخدم الحالي مدير، استبعد الأدمن
    if (req.user.role === 'manager') {
      filter.role = { $ne: 'admin' };
    }

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          usersPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires')
      .populate('children', 'firstName lastName email role');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// @desc    Get students by parent ID
// @route   GET /api/users/parent/:parentId/students
// @access  Private
const getStudentsByParent = asyncHandler(async (req, res) => {
  try {
    const students = await User.find({
      parentId: req.params.parentId,
      role: 'student'
    }).select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires');

    res.json({
      success: true,
      data: { students }
    });
  } catch (error) {
    console.error('Get students by parent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
});

// @desc    Get student with parent information
// @route   GET /api/users/student/:studentId/with-parent
// @access  Private
const getStudentWithParent = asyncHandler(async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId)
      .select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires')
      .populate('parentId', 'firstName lastName email phone');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: { student }
    });
  } catch (error) {
    console.error('Get student with parent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student',
      error: error.message
    });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin or self)
const updateUser = asyncHandler(async (req, res) => {
  try {
    const { firstName, lastName, email, role, phone, licenseNumber } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        email,
        role,
        phone: role === 'driver' ? phone : undefined,
        licenseNumber: role === 'driver' ? licenseNumber : undefined
      },
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user has profile image, delete from Cloudinary
    if (user.profileImage) {
      try {
        const publicId = user.profileImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error('Failed to delete image from Cloudinary:', cloudinaryError);
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// @desc    Upload profile image
// @route   POST /api/users/upload-profile-image
// @access  Private
const uploadProfileImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile image from Cloudinary if exists
    if (user.profileImage) {
      try {
        const publicId = user.profileImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error('Failed to delete old image from Cloudinary:', cloudinaryError);
      }
    }

    // Update user with new profile image URL
    user.profileImage = req.file.path;
    await user.save();

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile image',
      error: error.message
    });
  }
});

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires')
      .populate('children', 'firstName lastName email role');

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current user',
      error: error.message
    });
  }
});

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private
const updateCurrentUser = asyncHandler(async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const userId = req.user.id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, phone },
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check old password
    const isOldPasswordValid = await user.matchPassword(oldPassword);
    if (!isOldPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Old password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
});

// @desc    Add child to parent
// @route   POST /api/users/add-child
// @access  Private (Parent only)
const addChildToParent = asyncHandler(async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const parentId = req.user.id;

    // Check if parent
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can add children'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Create child user
    const child = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'student',
      parentId
    });

    // Add child to parent's children array
    await User.findByIdAndUpdate(parentId, {
      $push: { children: child._id }
    });

    res.status(201).json({
      success: true,
      message: 'Child added successfully',
      data: {
        child: {
          id: child._id,
          firstName: child.firstName,
          lastName: child.lastName,
          email: child.email,
          role: child.role
        }
      }
    });
  } catch (error) {
    console.error('Add child error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add child',
      error: error.message
    });
  }
});

// @desc    Get children for parent
// @route   GET /api/users/children
// @access  Private (Parent only)
const getChildrenForParent = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can view their children'
      });
    }

    const parent = await User.findById(req.user.id)
      .populate('children', '-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires');

    res.json({
      success: true,
      data: { children: parent.children }
    });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch children',
      error: error.message
    });
  }
});

// @desc    Delete child from parent
// @route   DELETE /api/users/children/:childId
// @access  Private (Parent only)
const deleteChildFromParent = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can delete children'
      });
    }

    const { childId } = req.params;
    const parentId = req.user.id;

    // Verify child belongs to parent
    const child = await User.findOne({
      _id: childId,
      parentId,
      role: 'student'
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found or does not belong to you'
      });
    }

    // Remove child from parent's children array
    await User.findByIdAndUpdate(parentId, {
      $pull: { children: childId }
    });

    // Delete child user
    await User.findByIdAndDelete(childId);

    res.json({
      success: true,
      message: 'Child deleted successfully'
    });
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete child',
      error: error.message
    });
  }
});

// @desc    Verify email
// @route   GET /api/users/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  try {
  const { token } = req.query;
    
  if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is missing'
      });
  }

  const user = await User.findOne({ emailVerificationToken: token });
  if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: error.message
    });
  }
});

// @desc    Request password reset
// @route   POST /api/users/request-password-reset
// @access  Public
const requestPasswordReset = asyncHandler(async (req, res) => {
  try {
  const { email } = req.body;
    
  const user = await User.findOne({ email });
  if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
  }

    const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const message = `
      You requested a password reset for your Bus Management System account.
      
      Please click the following link to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this reset, please ignore this email.
    `;

  try {
    await sendEmail({
      to: user.email,
        subject: 'Password Reset Request - Bus Management System',
        text: message
      });
      
      res.json({
        success: true,
        message: 'Password reset email sent successfully'
      });
    } catch (emailError) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
      
      res.status(500).json({
        success: false,
        message: 'Failed to send reset email'
      });
    }
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: error.message
    });
  }
});

// @desc    Reset password
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
  }

  const user = await User.findOne({
    resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
});

// @desc    Parent updates their own child's info
// @route   PATCH /api/users/me/children/:childId
// @access  Private (Parent only)
const updateChildForParent = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const { childId } = req.params;
  const allowedFields = ['firstName', 'lastName', 'email', 'grade', 'school', 'password', 'busId'];
  const updates = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }
  // Find the parent and check if the child belongs to them
  const parent = await User.findById(parentId);
  if (!parent || !parent.children.includes(childId)) {
    return res.status(403).json({ message: 'Child does not belong to this parent' });
  }
  // Update the child
  const child = await User.findByIdAndUpdate(childId, updates, { new: true, runValidators: true }).select('-password');
  if (!child) {
    return res.status(404).json({ message: 'Child not found' });
  }
  res.json({ success: true, message: 'Child updated successfully', child });
});

const getAllDrivers = async (req, res) => {
  const drivers = await User.find({ role: "driver" });
  res.json(drivers);
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  getStudentsByParent,
  getStudentWithParent,
  updateUser,
  deleteUser,
  uploadProfileImage,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  addChildToParent,
  getChildrenForParent,
  deleteChildFromParent,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  updateChildForParent,
  getAllDrivers,
  upload // Export multer upload for use in routes
};
