const { where } = require('sequelize');
const db = require('../db/index');
const transporter = require('../middleware/email.config');

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
        res.status(200).json({"message":"OTP has been sent."})  
    }else{
        res.status(200).json({"message":"User not found. Please sign up"})  
    }
    } catch (error) {
    }
}
// Email sending route
var sendmail = async (req, res) => {
    try {
        let text = 'Please Verify the Profile.'
        const mailOptions = {
            from: 'vibeshot407@gmail.com', // Replace with your email
            to : req.body.email,
            subject : 'Verify Signup',
            html: `<p>${text}</p><p><a href="" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: blue; text-decoration: none; border-radius: 5px;">Verify Email</a></p>`
        };

        await transporter.sendMail(mailOptions)
        res.json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send email' });
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

module.exports = {signupuser,getusers,getuser,sendmail}