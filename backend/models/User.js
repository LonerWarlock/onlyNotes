const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows null if user only uses Google login
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId; // Password required only if not using Google login
    },
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows null if user uses username-password login
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', UserSchema);
