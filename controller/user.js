const { where } = require('sequelize');
const db = require('../db/index');
const transporter = require('../middleware/email.config');
const { generateOTP, saveOTP } = require('../middleware/otp.config');

let User = db.users;
var signupuser = async(req,res)=>{
    try {
    const body = req.body
    const existingUser = await User.findOne({
        where:{email :req.body.email}
    })
    if(!existingUser){
        const getuser = await User.create(body);
    res.status(200).json(getuser.toJSON())
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
    let text = 'Please Verify the Profile.'
        const mailOptions = {
            from: 'vibeshot407@gmail.com', // Replace with your email
            to : req.body.email,
            subject : 'Verify Signup',
            html: `<p>${text}</p><p><br/> <p>${otpData.otp}</p>`
        };

        await transporter.sendMail(mailOptions)
        res.status(200).json({"message":"OTP has been sent via Email."})  
    }else{
        res.status(200).json({"message":"User not found. Please sign up"})  
    }
    } catch (error) {
    }
}
// var verifyotp = async(req,res)=>{
//     try {
//         const {email,otp} = req.body
//     } catch (error) {
        
//     }
// }

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

module.exports = {signupuser,getusers,getuser,login}