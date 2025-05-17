const { where } = require("sequelize");
const db = require("../db/index");
const transporter = require("../middleware/email.config");
const { generateOTP, saveOTP, verifyOTP } = require("../middleware/otp.config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
let User = db.users;
let upload = db.upload;
const SECRET_KEY = process.env.JWT_SECRET;
const saltRounds = 10;
var signupuser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Signup request received for:", email);

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(200).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // Create new user
    const newUser = await User.create({
      ...req.body,
      password: hashedPassword,
    });
    console.log("User created successfully:", newUser.id);

    // Generate token
    const payload = { id: newUser.id, email: newUser.email };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });

    // Email verification
    const mailOptions = {
      from: "vibeshot407@gmail.com", // Replace with your email
      to: email,
      subject: "Verify Signup",
      html: `<p>Please Verify Your Profile.</p>
                   <p><br/>
                   <button style="padding: 5px 15px; font-size: 15px; background: #3eadf0; border: none; border-radius: 5px;">
                   <a href="http://localhost:3300/api/verifySignuptoken/${token}" 
                      style="text-decoration: none; color: white;">Verify</a></button>`,
    };

    // Send verification email
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent to:", email);

    res.status(200).json({ message: "Please verify your email." });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

var login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ where: { email: email } });

    if (!existingUser) {
      return res
        .status(400)
        .json({ message: "User not found. Please sign up" });
    }

    const comparePassword = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!comparePassword) {
      return res
        .status(401)
        .json({ message: "Password didn't match. Please try again." });
    }

    const otpData = generateOTP();

    // Respond immediately to the user
    res.status(200).json({ message: "OTP has been sent via Email." });

    // Save OTP in Redis in background
    saveOTP(email, otpData);

    // Send email in background
    const mailOptions = {
      from: "vibeshot407@gmail.com",
      to: email,
      subject: "OTP Verification",
      html: `<p>Your one-time password is:</p><p>${otpData.otp}</p>`,
    };

    transporter
      .sendMail(mailOptions)
      .then(() => console.log("OTP email sent successfully"))
      .catch((error) => console.error("Email Sending Error:", error));
  } catch (error) {
    console.error("Login Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
  }
};
var verifyotp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log(req.body);
    
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const isValid = verifyOTP(email, otp);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    const existingUser = await User.findOne({ where: { email: email },attributes: ['id', 'email', 'display_name', 'user_bio', 'username', 'dob'] });
    if (!existingUser) {
      return res
        .status(400)
        .json({ message: "User not found. Please sign up" });
    }
    const payload = { id: existingUser.id, email: existingUser.email };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
    res.status(200).json({ message: "OTP verified successfully",user: existingUser,token:token  });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ message: "Something went wrong, please try again" });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[0];
    if (!token) return res.status(400).json({ message: "No token provided" });

    // Verify the token and extract expiration time
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded) {
      res.status(200).json({ message: "Logged out successfully." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging out." });
  }
};
var getusers = async (req, res) => {
  const data = await User.findAll({});
  res.status(200).json({ data: data });
};
var getuser = async (req, res) => {
  console.log(req.params.id);

  const data = await User.findOne({
    where: { id: req.params.id },
  });
  res.status(200).json({ data: data });
};
var editUserDetails = async (req,res)=>{
  try {
    const {userId,display_name,user_bio} = req.body
  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
}
    await User.update({
      display_name : display_name || User.display_name,
      user_bio: user_bio || User.user_bio
    })
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error){
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
}
var verifySignuptoken = async (req, res) => {
  const token = req.params.token;
  console.log(token);

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log(decoded);

    const email = decoded.email;
    const id = decoded.id;
    if (email) {
      email.verified = true;
      return res.redirect(`http://localhost:4300/home?token=${token}&id=${id}`);
    } else {
      return res.status(400).json({ message: "Invalid token" });
    }
  } catch (error) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
};
const uploadProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { description, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if the user exists before inserting into the Upload table
    const userExists = await User.findOne({ where: { id: userId } });

    if (!userExists) {
      return res.status(400).json({ message: "User does not exist" });
    }

    // Save file details in the database
    const newFile = await upload.create({
      filename: req.file.filename,
      fileUrl: `/uploads/${req.file.filename}`, // Change this if using S3
      description: description,
      userId: userId, // Associate upload with the user
    });

    res.json({ message: "File uploaded successfully", file: newFile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getUserProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find the uploaded profile image by userId
    const upload = await db.upload.findOne({
      where: { userId: userId },
      attributes: ["fileUrl"], // Select only the file URL
    });

    if (!upload) {
      return res.status(404).json({ message: "Profile image not found" });
    }

    res.json({ profileImageUrl: upload.fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
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
  editUserDetails
};
