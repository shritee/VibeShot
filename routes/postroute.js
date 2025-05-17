const express = require('express');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const AuthRoutes = express.Router();
const upload = multer({ dest: 'uploads/' });
AuthRoutes.get("/upload", verifyToken,upload.single('media'));
module.exports = AuthRoutes