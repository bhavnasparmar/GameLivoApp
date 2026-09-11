const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gamelivo_super_secret_jwt_key_2026';
const STATIC_OTP = '111111'; // Static verification code

const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '7d',
  });
  const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken, expiresIn: 604800 };
};

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication, OTP verification, and password management
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: aarav.kapoor
 *               password:
 *                 type: string
 *                 example: Pass@1234
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', (req, res) => {
  const { identifier, password, mobile, email } = req.body;
  const userIdentifier = identifier || email || mobile || 'player_one';

  const user = {
    id: 'user_1',
    name: 'Aarav Kapoor',
    username: userIdentifier.includes('@') ? userIdentifier.split('@')[0] : 'aarav.kapoor',
    mobile: mobile || '+91 98765 43210',
    email: email || 'aarav@email.com',
    level: 14,
    coins: 2480,
    rank: 128,
  };

  const tokens = generateTokens(user);
  return res.success({ tokens, user }, 'Logged in successfully');
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register New Player
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Aarav Kapoor
 *               username:
 *                 type: string
 *                 example: aarav.kapoor
 *               mobile:
 *                 type: string
 *                 example: "+91 98765 43210"
 *               email:
 *                 type: string
 *                 example: aarav@email.com
 *               password:
 *                 type: string
 *                 example: Secret@123
 *     responses:
 *       200:
 *         description: Account registered
 */
router.post('/register', (req, res) => {
  const { name, username, mobile, email, password } = req.body;

  const user = {
    id: `user_${Date.now()}`,
    name: name || 'New Player',
    username: username || 'player_' + Math.floor(1000 + Math.random() * 9000),
    mobile: mobile || '+91 98765 00000',
    email: email || 'newplayer@gamelivo.com',
    level: 1,
    coins: 1000,
    rank: 999,
  };

  const tokens = generateTokens(user);
  return res.success({ tokens, user, message: 'Account registered successfully' }, 'Registration successful');
});

/**
 * @swagger
 * /auth/otp/send:
 *   post:
 *     summary: Send OTP to Mobile / Email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "+91 98765 43210"
 *               type:
 *                 type: string
 *                 example: login
 *     responses:
 *       200:
 *         description: OTP Sent
 */
router.post('/otp/send', (req, res) => {
  const { mobile, email, type } = req.body;
  return res.success(
    { otpSent: true, target: mobile || email, staticOTP: STATIC_OTP },
    `OTP sent successfully. (Static code: ${STATIC_OTP})`
  );
});

/**
 * @swagger
 * /auth/otp/verify:
 *   post:
 *     summary: Verify Mobile / Email OTP (Static 111111 Supported)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "111111"
 *               mobile:
 *                 type: string
 *                 example: "+91 98765 43210"
 *     responses:
 *       200:
 *         description: Verified successfully
 */
router.post('/otp/verify', (req, res) => {
  const { otp, mobile, email } = req.body;

  if (otp === STATIC_OTP || otp === '111111' || !otp) {
    const user = {
      id: 'user_1',
      name: 'Aarav Kapoor',
      username: 'aarav.kapoor',
      mobile: mobile || '+91 98765 43210',
      email: email || 'aarav@email.com',
      level: 14,
      coins: 2480,
      rank: 128,
    };
    const tokens = generateTokens(user);
    return res.success({ tokens, user }, 'OTP verified successfully');
  }

  return res.error('Invalid OTP. Please enter 111111', 400);
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request Password Reset
 *     tags: [Auth]
 */
router.post('/forgot-password', (req, res) => {
  return res.success(
    { resetToken: 'RESET_TOKEN_' + Date.now(), staticOTP: STATIC_OTP },
    `Password reset instructions sent. Use OTP: ${STATIC_OTP}`
  );
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset Password with OTP
 *     tags: [Auth]
 */
router.post('/reset-password', (req, res) => {
  return res.success({}, 'Password has been updated successfully');
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User Logout
 *     tags: [Auth]
 */
router.post('/logout', (req, res) => {
  return res.success({}, 'Logged out successfully');
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh Access Token
 *     tags: [Auth]
 */
router.post('/refresh', (req, res) => {
  const user = { id: 'user_1', username: 'aarav.kapoor' };
  const tokens = generateTokens(user);
  return res.success({ tokens }, 'Token refreshed successfully');
});

module.exports = router;
