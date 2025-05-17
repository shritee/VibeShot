const crypto = require("crypto");

const otpStore = new Map(); // Temporary storage (use Redis for production)

function generateOTP(length = 6) {
    const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
    const expiry = Date.now() + 1 * 60 * 1000; // OTP expires in 1 minutes
    return { otp, expiry };
}

function saveOTP(identifier, otpData) {
    otpStore.set(identifier, otpData);
}

function verifyOTP(identifier, userOtp) {
    const otpData = otpStore.get(identifier);
    if (!otpData) return false;

    if (Date.now() > otpData.expiry) {
        otpStore.delete(identifier);
        return false; // Expired OTP
    }

    if (otpData.otp !== userOtp) return false; // Incorrect OTP

    otpStore.delete(identifier); // Remove OTP after successful verification
    return true;
}

module.exports = { generateOTP, saveOTP, verifyOTP };
