const jwt = require('jsonwebtoken');

// Checks that the request has a valid JWT token.
// Add this to any route that should only work for logged-in users.
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization']; // expects "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token. Please log in again.' });
    }
    req.user = decoded; // now req.user.user_id is available in the route
    next();
  });
}

// Checks that the logged-in user is an admin.
// Always use AFTER verifyToken (verifyToken sets req.user first).
function verifyAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access only.' });
  }
  next();
}

module.exports = { verifyToken, verifyAdmin };
