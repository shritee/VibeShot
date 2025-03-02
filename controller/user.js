const { where } = require('sequelize');
const db = require('../db/index');
const transporter = require('../middleware/email.config');
const { generateOTP, saveOTP } = require('../middleware/otp.config');
const jwt = require("jsonwebtoken");
let User = db.users;
const SECRET_KEY = process.env.JWT_SECRET;
var signupuser = async(req,res)=>{
    try {
    const body = req.body
    const existingUser = await User.findOne({
        where:{email :req.body.email}
    })
    if(!existingUser){
        const getuser = await User.create(body);
        const payload = { id: getuser.id, email: getuser.email };
        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
        let text = 'Please Verify the Profile.'
        const mailOptions = {
            from: 'vibeshot407@gmail.com', // Replace with your email
            to : req.body.email,
            subject : 'Verify Signup',
            html: `<p>${text}</p><p><br/><button style="padding: 5px 15px;
    font-size: 15px;
    background: #3eadf0;
    border: none;
    border-radius: 5px;"><a href="http://localhost:4300/login?token=${token}" style="text-decoration: none;
    color: white;">Verify</a></button>`
        };

        await transporter.sendMail(mailOptions)
    res.status(200).json({"message":"Please Verify your mail."})
    }else{
        res.status(200).json({"message":"User Already exist"})  
    }
    } catch (error) {
    }
}
var login = async(req,res)=>{
    try {
    const body = req.body
    const existingUser = await User.findOne({
        where:{email :req.body.email}
    })
    if(existingUser){
        const otpData = generateOTP();
    saveOTP(body.email, otpData);
    let text = 'Your one time password is here.'
        const mailOptions = {
            from: 'vibeshot407@gmail.com',
            to : req.body.email,
            subject : 'OTP Verification',
            html: `<p>${text}</p><p><br/> <p>${otpData.otp}</p>`
        };

        await transporter.sendMail(mailOptions);
        const payload = { id: existingUser.id, email: existingUser.email };
        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
        res.status(200).json({"message":"OTP has been sent via Email.","token":token})  
    }else{
        res.status(200).json({"message":"User not found. Please sign up"})  
    }
    } catch (error) {
    }
}

var getusers = async(req,res)=>{
    const data = await User.findAll({});
    res.status(200).json({data:data});
}
var getuser = async(req,res)=>{
    console.log(req.params.id);
    
    const data = await User.findOne({
        where:{id:req.params.id}
    });
    res.status(200).json({data:data});
}
var verifyJWTToken =(req, res) => {
    res.json({ message: "This is a protected route", email: req.email });
  }
module.exports = {signupuser,getusers,getuser,login,verifyJWTToken}