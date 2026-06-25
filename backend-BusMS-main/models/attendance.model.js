const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  personId: {
    type: mongoose.Schema.Types.ObjectId,
    // type: Number,
    required: true,
    ref: "User",
    validate: {
      validator: async function(value) {
        const User = mongoose.model('User');
        const user = await User.findById(value);
        // Compare both as lowercase for robustness
        return user && this.personType.toLowerCase() === user.role.toLowerCase();
      },
      message: 'Person type must match user role'
    }
  },
  personType: {
    type: String,
    enum: ["student", "employee"],
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["present", "absent"],
    required: true,
  },
  boardingTime: String,
  deboardingTime: String,
  // Optional: parentId for easier parent queries
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
});

// Index for fast queries by personId and date
attendanceSchema.index({ personId: 1, date: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
