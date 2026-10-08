const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const User = require('./models/User');
mongoose.connect(process.env.MONGO_URL).then(()=>console.log('✅ MongoDB Connected')).catch(e=>console.log(e));
app.use(express.static(path.join(__dirname,'../frontend')));

function euclideanDistance(a,b){ let s=0; for(let i=0;i<a.length;i++) s+=Math.pow(a[i]-b[i],2); return Math.sqrt(s); }

app.post('/api/auth/register', async (req,res)=>{
  try{
    const { name, aadharNumber, mobileNumber, voterId, faceData, faceDescriptor } = req.body;

    // 1. Check Aadhaar
    if(await User.findOne({ aadharNumber })) return res.status(400).json({message:`🚫 Aadhaar ${aadharNumber} already registered!`});
    // 2. Check VoterID
    if(await User.findOne({ voterId })) return res.status(400).json({message:`🚫 VoterID ${voterId} already registered!`});
    // 3. Check Mobile
    if(await User.findOne({ mobileNumber })) return res.status(400).json({message:`🚫 Mobile ${mobileNumber} already registered!`});

    // 4. CHECK SAME FACE - One Person One Vote
    if(faceDescriptor){
      const allUsers = await User.find();
      for(let u of allUsers){
        if(u.faceDescriptor && u.faceDescriptor.length > 0){
          let sum = 0;
          for(let i=0;i<faceDescriptor.length;i++) sum += Math.pow(faceDescriptor[i]-u.faceDescriptor[i],2);
          let distance = Math.sqrt(sum);
          if(distance < 0.5){ // 0.5 = Same person
            return res.status(400).json({message:`🚫 Same Face already registered as ${u.name}! One Person One Vote!`});
          }
        }
      }
    }

    const newUser = new User({ name, aadharNumber, mobileNumber, voterId, faceData, faceDescriptor, hasVoted:false });
    await newUser.save();
    res.json({message:"Registered! You can Login now!"});
  }catch(e){ res.status(500).json({message:e.message}) }
});

app.post('/api/auth/login', async (req,res)=>{
  const {aadharNumber,voterId}=req.body;
  const user=await User.findOne({aadharNumber,voterId});
  if(!user) return res.status(400).json({message:'User not found - Register first'});
  if(user.hasVoted) return res.status(400).json({message:'🚫 You already voted! One Person One Vote Blocked!'});
  res.json({message:'Login Success', user});
});

app.post('/api/vote', async (req,res)=>{
  try{
    const { aadharNumber, votedFor } = req.body;
    const user = await User.findOne({ aadharNumber });
    if(!user) return res.status(404).json({message:"Not found - User missing, please Register again"});
    if(user.hasVoted) return res.status(400).json({message:"You already voted!"});

    user.hasVoted = true;
    user.votedFor = votedFor;

    // ===== BLOCKCHAIN HASHCHAIN LOGIC =====
    const lastBlock = await User.findOne({hasVoted: true, currentHash: {$exists:true}}).sort({blockIndex: -1});
    const prevHash = lastBlock? lastBlock.currentHash : "0";
    const blockIndex = lastBlock? lastBlock.blockIndex + 1 : 1;

    const blockData = user.aadharNumber + votedFor + Date.now() + prevHash + blockIndex;
    const currHash = crypto.createHash('sha256').update(blockData).digest('hex');

    user.previousHash = prevHash;
    user.currentHash = currHash;
    user.blockIndex = blockIndex;
    user.votedAt = new Date();
    console.log(`✅ Block #${blockIndex} | Prev: ${prevHash.substring(0,8)}... | Curr: ${currHash.substring(0,8)}...`);
    // ===== END BLOCKCHAIN =====

    await user.save();
    res.json({message:`Vote for ${votedFor} recorded! Block #${blockIndex} Created - Hash: ${currHash.substring(0,12)}...`});
  }catch(e){
    console.log(e);
    res.status(500).json({message:e.message})
  }
})

app.get('/api/results', async (req,res)=>{
  const users=await User.find({hasVoted:true}).sort({blockIndex:1});
  const counts={};
  users.forEach(u=>{ counts[u.votedFor]=(counts[u.votedFor]||0)+1; });
  res.json({totalVoted:users.length, counts, users, blockchainValid: true});
});

// OPTIONAL: Verify Blockchain Integrity
app.get('/api/verify-chain', async (req,res)=>{
  const chain = await User.find({hasVoted:true, currentHash:{$exists:true}}).sort({blockIndex:1});
  let valid = true;
  let message = "Blockchain Valid - No Tampering";
  for(let i=1;i<chain.length;i++){
    if(chain[i].previousHash!== chain[i-1].currentHash){
      valid = false;
      message = `Chain BROKEN at Block #${chain[i].blockIndex}! Tampering detected!`;
      break;
    }
  }
  res.json({valid, message, totalBlocks: chain.length, chain});
});

app.listen(process.env.PORT||10000, ()=>console.log('✅ Running on 10000 - Blockchain Enabled'));