const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'jobportal_super_secret_key_2024';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireEmployer = (req, res, next) => {
  if (req.user.role !== 'employer') {
    return res.status(403).json({ error: 'Only employers can perform this action' });
  }
  next();
};

const requireJobseeker = (req, res, next) => {
  if (req.user.role !== 'jobseeker') {
    return res.status(403).json({ error: 'Only job seekers can perform this action' });
  }
  next();
};

module.exports = { authenticate, requireEmployer, requireJobseeker, JWT_SECRET };
