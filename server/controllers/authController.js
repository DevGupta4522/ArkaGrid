import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/connection.js';
import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET || 'my-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'my-refresh-secret-key';
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validate input
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits',
        code: 'INVALID_PHONE'
      });
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with 1 uppercase letter and 1 number',
        code: 'WEAK_PASSWORD'
      });
    }

    if (!['prosumer', 'consumer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be prosumer or consumer',
        code: 'INVALID_ROLE'
      });
    }

    // Check if email exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, email, phone, role, kyc_verified, rating_avg, wallet_balance, created_at`,
      [uuidv4(), name, email, phone, passwordHash, role]
    );

    const user = result.rows[0];

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshTokenStr = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Hash and store refresh token
    const refreshTokenHash = await bcrypt.hash(refreshTokenStr, 12);
    const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, refreshTokenExpiry]
    );

    // Set httpOnly cookie
    res.cookie('refreshToken', refreshTokenStr, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          wallet_balance: user.wallet_balance,
          rating_avg: user.rating_avg
        },
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, name, email, role, password_hash, kyc_verified, rating_avg, wallet_balance, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshTokenStr = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Hash and store refresh token
    const refreshTokenHash = await bcrypt.hash(refreshTokenStr, 12);
    const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, refreshTokenExpiry]
    );

    // Set httpOnly cookie
    res.cookie('refreshToken', refreshTokenStr, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY
    });

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          wallet_balance: user.wallet_balance,
          rating_avg: user.rating_avg
        },
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Get user and check token exists in DB
    const result = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Generate new refresh token (rotate)
    const newRefreshTokenStr = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const newRefreshTokenHash = await bcrypt.hash(newRefreshTokenStr, 12);
    const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);

    // Invalidate old token(s) and insert new one
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < NOW()', [user.id]);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, newRefreshTokenHash, refreshTokenExpiry]
    );

    // Set new httpOnly cookie
    res.cookie('refreshToken', newRefreshTokenStr, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { accessToken: newAccessToken }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      // Invalidate all refresh tokens for this user
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
    }

    // Clear cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, kyc_verified, rating_avg, wallet_balance, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// ─── Google OAuth Login ───
export const googleLogin = async (req, res, next) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required',
        code: 'MISSING_CREDENTIAL'
      });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured on the server',
        code: 'GOOGLE_NOT_CONFIGURED'
      });
    }

    // Verify Google ID token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google credential',
        code: 'INVALID_GOOGLE_TOKEN'
      });
    }

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email not available from Google account',
        code: 'NO_EMAIL'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id, name, email, role, wallet_balance, rating_avg, is_active FROM users WHERE email = $1',
      [email]
    );

    let user;
    let isNewUser = false;

    if (existingUser.rows.length > 0) {
      // Existing user — log them in
      user = existingUser.rows[0];

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is inactive',
          code: 'ACCOUNT_INACTIVE'
        });
      }
    } else {
      // New user — create account
      isNewUser = true;
      const selectedRole = ['prosumer', 'consumer'].includes(role) ? role : 'consumer';

      // Generate a random password (user won't need it since they use Google)
      const randomPassword = uuidv4();
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      const result = await pool.query(
        `INSERT INTO users (id, name, email, phone, password_hash, role, wallet_balance) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, name, email, role, wallet_balance, rating_avg`,
        [uuidv4(), name || 'Google User', email, '0000000000', passwordHash, selectedRole, selectedRole === 'consumer' ? 1000.00 : 0.00]
      );
      user = result.rows[0];
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshTokenStr = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token
    const refreshTokenHash = await bcrypt.hash(refreshTokenStr, 12);
    const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, refreshTokenExpiry]
    );

    // Set httpOnly cookie
    res.cookie('refreshToken', refreshTokenStr, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY
    });

    res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: isNewUser ? 'Account created with Google' : 'Logged in with Google',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          wallet_balance: user.wallet_balance,
          rating_avg: user.rating_avg
        },
        accessToken,
        isNewUser
      }
    });
  } catch (error) {
    next(error);
  }
};
