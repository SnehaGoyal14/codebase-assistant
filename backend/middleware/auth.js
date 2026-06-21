const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    // Expected format: Bearer <token>
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format'
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();

  } catch (err) {
    console.error('Token Verification Error:', err.message);

    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};