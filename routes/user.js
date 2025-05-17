const express = require('express');
const { getusers, signupuser, getuser, login, verifySignuptoken, logout, verifyotp, uploadProfile, getUserProfileImage, editUserDetails } = require('../controller/user');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/multerStorage');

const AuthRoutes = express.Router();

AuthRoutes.get('/user',getusers);
AuthRoutes.post('/signup',signupuser);
AuthRoutes.get('/user/:id',getuser);
AuthRoutes.get('/user/:id',getuser);
AuthRoutes.get('/edit-user-detail',authenticate,editUserDetails);
AuthRoutes.post('/login',login);
AuthRoutes.post('/verify-otp',verifyotp);
AuthRoutes.post("/logout", authenticate,logout);
AuthRoutes.get("/verifySignuptoken/:token", verifySignuptoken);
AuthRoutes.post("/upload",authenticate, upload.single("file"),uploadProfile)
AuthRoutes.get("/user/:userId/getprofileimage",authenticate,getUserProfileImage)
module.exports = AuthRoutes
