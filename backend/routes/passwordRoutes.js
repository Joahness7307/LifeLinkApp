const express = require("express");
const router = express.Router();
const {
  forgotPassword,
  resetPassword,
} = require("../controllers/passwordController");

// POST /api/password/forgot-password
router.post("/forgot-password", forgotPassword);

// POST /api/password/reset-password
router.post("/reset-password", resetPassword);

module.exports = router;
