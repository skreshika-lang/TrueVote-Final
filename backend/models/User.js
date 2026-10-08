const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: String,
  aadharNumber: {type:String, unique:true},
  mobileNumber: String,
  voterId: {type:String, unique:true},
  faceData: String,
  faceDescriptor: {type: Array, default: []},
  hasVoted: {type:Boolean, default:false},
  votedFor: String,
  votedAt: Date,
  // BLOCKCHAIN FIELDS
  previousHash: {type:String, default:"0"},
  currentHash: String,
  blockIndex: Number
});
module.exports = mongoose.model('User', userSchema);