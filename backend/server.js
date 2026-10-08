const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

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
    const {name,aadharNumber,mobileNumber,voterId,faceData,faceDescriptor}=req.body;
    if(!name||!aadharNumber||!mobileNumber||!voterId||!faceData) return res.status(400).json({message:'All fields + Photo required'});
    if(await User.findOne({aadharNumber})) return res.status(400).json({message:'🚫 Aadhaar already registered! One Person One Vote!'});
    if(await User.findOne({mobileNumber})) return res.status(400).json({message:'🚫 Mobile already registered!'});
    if(await User.findOne({voterId})) return res.status(400).json({message:'🚫 Voter ID already registered!'});
    if(faceDescriptor){
      const all=await User.find({},'faceDescriptor name');
      for(let u of all){ if(u.faceDescriptor && euclideanDistance(faceDescriptor,u.faceDescriptor)<0.5) return res.status(400).json({message:`🚫 Same Face already registered as ${u.name}!`}); }
    }
    const user=await User.create({name,aadharNumber,mobileNumber,voterId,faceData,faceDescriptor,isApproved:true});
    res.json({message:'Registration Success! Now Login', user});
  }catch(e){ res.status(500).json({message:e.message}); }
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
    user.votedAt = new Date();
    await user.save();
    res.json({message:`Vote for ${votedFor} recorded!`});
  }catch(e){ res.status(500).json({message:e.message}) }
})

app.get('/api/results', async (req,res)=>{
  const users=await User.find({hasVoted:true});
  const counts={}; users.forEach(u=>{ counts[u.votedFor]=(counts[u.votedFor]||0)+1; });
  res.json({totalVoted:users.length, counts, users});
});

app.listen(process.env.PORT||10000, ()=>console.log('✅ Running on 10000 - No Approval Needed'));