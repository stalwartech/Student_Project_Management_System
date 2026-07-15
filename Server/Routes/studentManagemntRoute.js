const express = require("express")
const router = express.Router()

router.get("/coordinator/students")
router.get("/coordinator/students/:studentId")
router.patch("/coordinator/students/:studentId/activate")
router.patch("/coordinator/students/:studentId/deactivate")