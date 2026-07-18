const express = require("express");
const router = express.Router();

const { sendOTP, verifyOTP, resendOTP } = require("../controllers/otpController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/otp/send", sendOTP);
router.post("/otp/verify", verifyOTP);
router.post("/otp/resend", resendOTP);

// Was missing entirely - meant require() of this file returned undefined
// and mounting it in server.js would have failed.
module.exports = router;
