
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const User = require('./models/User');

async function createAdmin(){
  try{
    console.log("Trying with Google DNS...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");
    const email = (process.env.OWNER_EMAIL || "skreshika@gmail.com").toLowerCase();
    let admin = await User.findOne({ email });
    const hashed = await bcrypt.hash("Kreshika@123", 10);
    if(admin){
      admin.password = hashed; admin.role='admin'; admin.isApproved=true;
      await admin.save();
      console.log(`✅ Updated: ${email} / Kreshika@123`);
    } else {
      await User.create({ name:"Kreshika Owner", email, password:hashed, role:'admin', isApproved:true });
      console.log(`✅ Created: ${email} / Kreshika@123`);
    }
    process.exit(0);
  }catch(err){ console.error("❌ Error:", err.message); process.exit(1); }
}
createAdmin();