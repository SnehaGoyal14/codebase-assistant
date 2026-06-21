const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

const router = express.Router();

/**
 * Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: 'user'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );
}

/**
 * Basic email validation
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * POST /auth/signup
 */
router.post('/signup', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email`,
      [email, passwordHash]
    );

    const user = result.rows[0];

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user
    });

  } catch (err) {
    console.error('Signup Error:', err.message);

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Login Error:', err.message);

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;