
# SECURE E-VOTING FIXED - OWNER ONLY ADMIN + FACE DUPLICATE BLOCK

## WHAT IS FIXED?
1. Face Verification: Same face cannot register twice - checks Euclidean distance < 0.5
2. Registration: No admin option, always voter, needs owner approval
3. Admin: Only OWNER_EMAIL can be admin and approve

## SETUP TONIGHT:

1. Extract zip
2. cd backend
3. npm install
4. Create .env file from .env.example - CHANGE OWNER_EMAIL to your email
5. node createAdmin.js  -> Creates you as admin
6. node server.js -> Runs on 10000

## DEPLOY TO RENDER:
- Push this folder to GitHub: https://github.com/skreshika-lang/Secure-EVoting-Final
- Render will auto deploy
- Add ENV: OWNER_EMAIL = your email

## TESTING:
- Register User A with face -> Success -> Login says "Waiting for approval"
- Login as owner admin -> Approve User A
- Try register User B with SAME face as A -> BLOCKED "Face already registered!"
- User A can now login and vote

Owner Admin Login:
Email: skreshika.owner@gmail.com (your OWNER_EMAIL)
Password: Kreshika@123

