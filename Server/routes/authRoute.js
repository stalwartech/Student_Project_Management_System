const express = require("express");
const router = express.Router();

const {
  importStudents,
  importSupervisors,
  activate,
  verifyOTP,
  createPassword,
  login,
  logout,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  changePassword,
  getMe,
  refreshToken,
} = require("../controllers/authController");

const { protect, authorize, requireActivationToken } = require("../middleware/auth");
const { uploadCSV } = require("../middleware/upload");

router.post("/import/students", protect, authorize("coordinator"), uploadCSV.single("file"), importStudents);
router.post("/import/supervisors", protect, authorize("coordinator"), uploadCSV.single("file"), importSupervisors);

router.post("/activate", activate);
router.post("/verify-otp", verifyOTP);
router.post("/create-password", requireActivationToken("activation"), createPassword);

router.post("/login", login);
router.post("/logout", logout);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", requireActivationToken("password_reset"), resetPassword);

router.patch("/change-password", protect, changePassword);

router.get("/me", protect, getMe);

router.post("/refresh-token", refreshToken);

module.exports = router;
