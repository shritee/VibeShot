const { where } = require("sequelize");
const db = require("../db/index");
const transporter = require("../middleware/email.config");
const { generateOTP, saveOTP, verifyOTP } = require("../middleware/otp.config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client, uploadFile, deleteFile  } = require("../middleware/s3");
// const { s3Client, uploadFile, deleteFile } = require("../middleware/s3.config");
const { Op } = require('sequelize');
const User = db.users;
const Upload = db.upload;
const Posts = db.posts;
const Likes = db.likes;
const comments = db.comments;

const SECRET_KEY = process.env.JWT_SECRET;
const saltRounds = 10;

// Signup
const signupuser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(200).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      ...req.body,
      password: hashedPassword,
      isVerified: false,
    });

    const payload = { id: newUser.id, email: newUser.email };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "24h" });

    const mailOptions = {
      from: "vibeshot407@gmail.com",
      to: email,
      subject: "Verify Signup",
      html: `
        <p>Please Verify Your Profile.</p>
        <p>
          <br/>
          <button style="padding: 5px 15px; font-size: 15px; background: #3eadf0; border: none; border-radius: 5px;">
            <a href="http://localhost:3300/api/verifySignuptoken/${token}" style="text-decoration: none; color: white;">Verify</a>
          </button>
        </p>`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Please verify your email." });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ where: { email } });

    if (!existingUser) {
      return res.status(400).json({ message: "User not found. Please sign up" });
    }

    const comparePassword = await bcrypt.compare(password, existingUser.password);
    if (!comparePassword) {
      return res.status(401).json({ message: "Incorrect password. Please try again." });
    }

    const otpData = generateOTP();
    res.status(200).json({ message: "OTP has been sent via Email." });
    saveOTP(email, otpData);

    const mailOptions = {
      from: "vibeshot407@gmail.com",
      to: email,
      subject: "OTP Verification",
      html: `<p>Your one-time password is:</p><p>${otpData.otp}</p>`,
    };

    transporter.sendMail(mailOptions)
      .then(() => console.log("OTP email sent successfully"))
      .catch((error) => console.error("Email Sending Error:", error));
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};

// OTP Verification
const verifyotp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const isValid = verifyOTP(email, otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const existingUser = await User.findOne({
      where: { email },
      attributes: ['id', 'email', 'display_name', 'user_bio', 'username', 'dob']
    });

    if (!existingUser) {
      return res.status(400).json({ message: "User not found. Please sign up" });
    }

    const payload = { id: existingUser.id, email: existingUser.email };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });

    res.status(200).json({ message: "OTP verified successfully", user: existingUser, token });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ message: "Something went wrong, please try again" });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(400).json({ message: "No token provided" });

    jwt.verify(token, SECRET_KEY); // Just verifying for completeness
    res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error logging out." });
  }
};

// Get all users
const getusers = async (req, res) => {
  const data = await User.findAll({});
  res.status(200).json({ data });
};

// Get single user
const getuser = async (req, res) => {
  const data = await User.findOne({
    where: { id: req.params.id },
  });
  res.status(200).json({ data });
};

// Edit user details
const editUserDetails = async (req, res) => {
  try {
    const { userId, display_name, user_bio } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update({
      display_name: display_name ?? user.display_name,
      user_bio: user_bio ?? user.user_bio,
    });

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Email verification after signup
const verifySignuptoken = async (req, res) => {
  const token = req.params.token;
  if (!token) return res.status(400).json({ message: "Token is required" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findByPk(decoded.id);

    if (!user) return res.status(400).json({ message: "Invalid token" });

    user.isVerified = true;
    await user.save();

    return res.redirect(`http://vibeshot-web.s3-website.eu-north-1.amazonaws.com/home?token=${token}&id=${user.id}`);
  } catch (error) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
};

// Upload profile image
const uploadProfile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { description, userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const userExists = await User.findOne({ where: { id: userId } });
    if (!userExists) return res.status(400).json({ message: "User does not exist" });

    const existingUpload = await Upload.findOne({ where: { userId } });

    const result = await uploadFile(req.file);
    const fileUrl = `/uploads/${result.Key}`;

    if (existingUpload) {
      const oldKey = existingUpload.fileUrl.split('/uploads/')[1];
      await deleteFile(oldKey);

      await existingUpload.update({
        filename: req.file.filename,
        fileUrl,
        description,
      });

      res.json({ message: "File updated successfully" });
    } else {
      await Upload.create({
        filename: req.file.filename,
        fileUrl,
        description,
        userId,
      });

      res.json({ message: "File uploaded successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get profile image
const getUserProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const userUpload = await Upload.findOne({
      where: { userId },
      attributes: ["fileUrl"],
    });

    if (!userUpload) return res.status(404).json({ message: "No upload found" });

    const key = userUpload.fileUrl.split('/uploads/')[1];

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    res.setHeader("Content-Type", response.ContentType || "image/jpeg");
    res.setHeader("Content-Disposition", `inline; filename="${key}"`);
    response.Body.pipe(res);
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(404).json({ message: "File not found or access denied." });
  }
};
// Upload profile image
const uploadPost = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { caption, userId ,createdAt} = req.body;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const userExists = await User.findOne({ where: { id: userId } });
    if (!userExists) return res.status(400).json({ message: "User does not exist" });


    const result = await uploadFile(req.file);
    const mediaUrl = `/uploads/${result.Key}`;
      await Posts.create({
        mediaUrl,
        caption,
        userId,
        createdAt
      });

      res.json({ message: "Post uploaded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const getAllPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const posts = await Posts.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'display_name', 'email']
        },
        {
          model: Likes,
          as: 'likes',
          attributes: ['userId']  // We only need userId to check who liked it
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Modify each post to include `likedByCurrentUser`
    const formattedPosts = posts.map(post => {
      const plainPost = post.get({ plain: true });
      const likedByCurrentUser = plainPost.likes.some(like => like.userId === userId);
      return {
        ...plainPost,
        likedByCurrentUser,
        likeCount: plainPost.likes.length,
        timeAgo: getTimeAgo(new Date(plainPost.createdAt))
      };
    });

    res.json(formattedPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Posts.findAll({
      where: { userId },
      include: [{ model: User, as:'user',attributes: ['id', 'username', 'email'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getPostbyPostId = async (req, res) => {
  const { postId,userId } = req.body;

  try {
    const post = await db.posts.findOne({
      where: { id: postId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username'] },
        {
          model: db.likes,
          as: 'likes',
          attributes: ['userId']
        }
      ]
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likedByCurrentUser = post.likes.some((like) => like.userId === userId);

    res.json({
      id: post.id,
      caption: post.caption,
      mediaUrl: post.mediaUrl,
      user: post.user,
      likeCount: post.likes.length,
      likedByCurrentUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const downloadPostsImage= async(req, res) => {
  try {
    const {fileUrl} = req.body
    const key = fileUrl.split('/uploads/')[1];

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    res.setHeader("Content-Type", response.ContentType || "image/jpeg");
    res.setHeader("Content-Disposition", `inline; filename="${key}"`);
    response.Body.pipe(res);
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(404).json({ message: "File not found or access denied." });
  }
};
const LikePost = async (req, res) => {
  const { postId,userId } = req.body;

  try {
    // Check if the like already exists
    const existingLike = await Likes.findOne({ where: { userId, postId } });
    if (existingLike) {
      return res.status(400).json({ message: "Post already liked." });
    }

    await db.likes.create({ userId, postId });
    return res.status(201).json({ message: "Post liked successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
}
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];

  for (let interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return count === 1
        ? `1 ${interval.label} ago`
        : `${count} ${interval.label}s ago`;
    }
  }

  return 'just now';
}
const unfolloweduser = async (req, res) => {
  const currentUserId = req.user.id; // You must set this using auth middleware

  try {
    // Get list of followed user IDs
    const followed = await db.followers.findAll({
      where: { followerId: currentUserId },
      attributes: ['followingId'],
    });

    const followedIds = followed.map(f => f.followingId);

    const usersNotFollowed = await db.users.findAll({
      where: {
        id: {
          [Op.ne]: currentUserId,
          [Op.notIn]: followedIds,
        },
      },
      attributes: ['id', 'username', 'display_name', 'email'],
    });

    res.json(usersNotFollowed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
}
const getFollowedUsers = async (req, res) => {
  const currentUserId = req.user.id;
  console.log(currentUserId);
  
  try {
    const user = await db.users.findByPk(currentUserId, {
      include: [
        {
          model: db.users,
          as: 'Following', // Make sure this matches your db.js alias
          attributes: ['id', 'username', 'email'], // Add any other fields you need
          through: { attributes: [] }, // Exclude pivot table fields
          include: [
            {
              model: db.upload,
              as: 'uploads', // Should match alias in user-upload association
              attributes: ['fileUrl'], // Or your actual column name
            }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    console.log(user,'checking user');
    

    res.status(200).json({ following: user.Following });
  } catch (error) {
    console.error('Error fetching followed users:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
const followUser = async (req, res) => {
  const followerId = req.user.id; 
  const { followingId } = req.body;

  if (followerId === followingId) {
    return res.status(400).json({ message: "You can't follow yourself." });
  }

  try {
    // Check if already following
    const alreadyFollowing = await db.followers.findOne({
      where: { followerId, followingId },
    });

    if (alreadyFollowing) {
      return res.status(400).json({ message: "Already following this user." });
    }

    // Create follow relationship
    await db.followers.create({ followerId, followingId });

    return res.status(200).json({ message: "Followed successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error while following user." });
  }
};

const commentOnPost = async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  const userId = req.user.id; // make sure auth middleware adds this

  if (!text) {
    return res.status(400).json({ message: 'Comment text is required.' });
  }

  try {
    const newComment = await comments.create({
      userId,
      postId,
      text,
      createdAt: new Date(),
    });

    res.status(201).json({ message: 'Comment added successfully', comment: newComment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};
module.exports = {
  signupuser,
  getusers,
  getuser,
  login,
  verifyotp,
  verifySignuptoken,
  logout,
  uploadProfile,
  getUserProfileImage,
  editUserDetails,
  uploadPost,
  getAllPosts,
  getUserPosts,
  downloadPostsImage,
  LikePost,
  getPostbyPostId,
  unfolloweduser,
  getFollowedUsers,
  commentOnPost,
  followUser
};
