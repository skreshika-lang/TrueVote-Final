const mongoose = require('mongoose');
const fraudLogSchema = new mongoose.Schema({
  attemptedEmail: String,
  attemptedAadhar: String,
  reason: String,
  existingUserEmail: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('FraudLog', fraudLogSchema);