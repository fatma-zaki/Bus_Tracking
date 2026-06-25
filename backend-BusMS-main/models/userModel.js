const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'driver', 'parent', 'student', 'employee', 'manager'] },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  licenseNumber: { type: String, required: function() { return this.role === 'driver'; } },
  phone: { type: String, required: function() { return this.role === 'driver'; } },
  profileImage: { type: String, default: '' },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', default: null },
  // isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Password match method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
