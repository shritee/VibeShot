const express = require('express');
const { getusers, signupuser, getuser, sendmail, login, verifyJWTToken } = require('../controller/user');
const { verifyToken } = require('../middleware/auth');

const AuthRoutes = express.Router();

AuthRoutes.get('/user',getusers);
AuthRoutes.post('/signup',signupuser);
AuthRoutes.get('/user/:id',getuser);
AuthRoutes.post('/login',login);
AuthRoutes.get("/protected", verifyToken,verifyJWTToken);
module.exports = AuthRoutes