const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');

// Validation middleware for registration
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('name')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long')
];

// Validation middleware for login
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Register a user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        status: "error", 
        message: 'Please enter all required fields' 
      });
    }

    // Check if user already exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        status: "error", 
        message: 'User already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await db.query(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, hashedPassword, name || null]
    );

    // Get the created user
    const [newUser] = await db.query(
      'SELECT id, email, name FROM users WHERE id = ?', 
      [result.insertId]
    );

    // Create JWT payload
    const payload = {
      user: {
        id: result.insertId
      }
    };

    // Generate JWT
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ 
          status: "success",
          message: 'User registered successfully',
          data: {
            user: newUser[0],
            token
          }
        });
      }
    );
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ 
      status: "error", 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Login a user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        status: "error", 
        message: 'Please enter all required fields' 
      });
    }

    // Check if user exists
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(400).json({ 
        status: "error", 
        message: 'Invalid credentials' 
      });
    }

    const user = users[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ 
        status: "error", 
        message: 'Invalid credentials' 
      });
    }

    // Create user object without password
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name
    };

    // Create JWT payload
    const payload = {
      user: {
        id: user.id
      }
    };

    // Generate JWT
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          status: "success",
          message: "Login successful",
          data: {
            user: userData,
            token
          }
        });
      }
    );
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ 
      status: "error", 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, email, name, created_at FROM users WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ 
        status: "error", 
        message: 'User not found' 
      });
    }

    res.json({
      status: "success",
      message: "Profile retrieved successfully",
      data: {
        user: users[0]
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      status: "error", 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;