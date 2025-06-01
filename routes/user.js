const express = require('express');
const { getusers, signupuser, getuser, login, verifySignuptoken, logout, verifyotp, uploadProfile, getUserProfileImage, editUserDetails, uploadPost, getAllPosts, getUserPosts, downloadPostsImage, LikePost, getPostbyPostId, unfolloweduser, followUser, getFollowedUsers } = require('../controller/user');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/multerStorage');

const AuthRoutes = express.Router();

AuthRoutes.post('/signup',signupuser);
AuthRoutes.get('/user/:id',getuser);
AuthRoutes.get('/user/:id',getuser);
AuthRoutes.get('/edit-user-detail',authenticate,editUserDetails);
AuthRoutes.post('/login',login);
AuthRoutes.post('/verify-otp',verifyotp);
AuthRoutes.post("/logout", authenticate,logout);
AuthRoutes.get("/verifySignuptoken/:token", verifySignuptoken);
AuthRoutes.post("/upload",authenticate, upload.single("file"),uploadProfile)
AuthRoutes.post("/uploadPost",authenticate, upload.single("file"),uploadPost)
AuthRoutes.get("/user/:userId/getprofileimage",authenticate,getUserProfileImage)
AuthRoutes.post("/downloadPostsImage",authenticate,downloadPostsImage)
AuthRoutes.get("/posts",authenticate,getAllPosts)
AuthRoutes.get("/posts/:userId",authenticate,getUserPosts)
AuthRoutes.post("/getPostbyPostId",authenticate,getPostbyPostId)
AuthRoutes.post("/like",authenticate,LikePost)
AuthRoutes.get('/user',authenticate,getusers);
AuthRoutes.get('/users/not-followed',authenticate,unfolloweduser)
AuthRoutes.get('/followed-users', authenticate, getFollowedUsers);
AuthRoutes.post('/follow',authenticate,followUser)
module.exports = AuthRoutes
