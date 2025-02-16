const nodemailer = require('nodemailer');

// Configure the transporter
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: 'vibeshot407@gmail.com', // Replace with your email
        pass: 'zjkfmehapzqvdkxa'   // Replace with your app password
    }
});

console.log('Transporter created:', typeof transporter.sendMail);
module.exports = transporter