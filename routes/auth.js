const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { User } = require("../models");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  // Create token
  const token = generateToken(user.id);

  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        (parseInt(process.env.JWT_COOKIE_EXPIRE) || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  // Remove password from output
  const userWithoutPassword = { ...user.toJSON() };
  delete userWithoutPassword.password;

  res.status(statusCode).cookie("token", token, cookieOptions).json({
    success: true,
    message,
    token,
    user: userWithoutPassword,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post(
  "/register",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("firstName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("First name is required"),
    body("lastName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Last name is required"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { email, password, firstName, lastName, timezone } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "User already exists with this email",
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(
        parseInt(process.env.BCRYPT_ROUNDS) || 12
      );
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        timezone: timezone || "UTC",
      });

      sendTokenResponse(user, 201, res, "User registered successfully");
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        error: "Server error during registration",
      });
    }
  }
);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Check for user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: "Account is deactivated",
        });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials",
        });
      }

      // Update last login
      await user.update({ lastLoginAt: new Date() });

      sendTokenResponse(user, 200, res, "Login successful");
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        error: "Server error during login",
      });
    }
  }
);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post("/logout", protect, (req, res) => {
  res
    .status(200)
    .cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logout successful",
    });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Update user details
// @route   PUT /api/auth/me
// @access  Private
router.put(
  "/me",
  protect,
  [
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("firstName")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("First name cannot be empty"),
    body("lastName")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Last name cannot be empty"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const fieldsToUpdate = {};
      const { email, firstName, lastName, timezone, preferences } = req.body;

      if (email && email !== req.user.email) {
        // Check if email is already taken
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            error: "Email is already taken",
          });
        }
        fieldsToUpdate.email = email;
      }

      if (firstName) fieldsToUpdate.firstName = firstName;
      if (lastName) fieldsToUpdate.lastName = lastName;
      if (timezone) fieldsToUpdate.timezone = timezone;
      if (preferences) fieldsToUpdate.preferences = preferences;

      const user = await req.user.update(fieldsToUpdate);

      // Remove password from response
      const userWithoutPassword = { ...user.toJSON() };
      delete userWithoutPassword.password;

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
);

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
router.put(
  "/password",
  protect,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findByPk(req.user.id);

      // Check current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: "Current password is incorrect",
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(
        parseInt(process.env.BCRYPT_ROUNDS) || 12
      );
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await user.update({ password: hashedPassword });

      res.status(200).json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("Update password error:", error);
      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
);

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post("/forgot-password", (req, res) => {
  // TODO: Implement password reset functionality
  res.status(501).json({
    success: false,
    message: "Password reset functionality not yet implemented",
    todo: "Implement email-based password reset with tokens",
  });
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
router.put("/reset-password/:token", (req, res) => {
  // TODO: Implement password reset functionality
  res.status(501).json({
    success: false,
    message: "Password reset functionality not yet implemented",
    todo: "Implement token-based password reset",
  });
});

module.exports = router;
