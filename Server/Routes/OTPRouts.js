const express = require("express")
const router = express.Router()

router.post("/otp/send")
router.post("/otp/verify")
router.post("/otp/resend")