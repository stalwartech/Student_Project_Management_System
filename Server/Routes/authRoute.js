const express = require("express")
const router = express.Router()

router.post("/auth/import/students")
router.post("/auth/import/supervisors")

router.post("/auth/activate")
router.post("/auth/verify-otp")
router.post("/auth/create-password")

router.post("/auth/login")
router.post("/auth/logout")

router.post("/auth/forgot-password")
router.post("/auth/verify-reset-otp")
router.post("/auth/reset-password")

router.patch("/auth/change-password")

router.get("/auth/me")

router.post("/auth/refresh-token")

module.exports = router

