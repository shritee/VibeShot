const express = require('express');
const { getusers, signupuser, getuser, sendmail, login } = require('../controller/user');

const AuthRoutes = express.Router();

AuthRoutes.get('/user',getusers);
AuthRoutes.post('/signup',signupuser);
AuthRoutes.get('/user/:id',getuser);
// AuthRoutes.post('/sendmail',sendmail);
AuthRoutes.post('/login',login);
module.exports = AuthRoutes