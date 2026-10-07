const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: String,
  aadharNumber: { type: String, unique: true },
  mobileNumber: { type: String, unique: true },
  voterId: { type: String, unique: true },
  faceData: String,
  faceDescriptor: Array,
  isApproved: { type: Boolean, default: true },
  hasVoted: { type: Boolean, default: false },
  votedFor: String,
  votedAt: Date
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);