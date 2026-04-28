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

const requireHR = (req, res, next) => {
  if (req.user.role !== 'hr' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only HR admins can perform this action' });
  }
  next();
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only Super Admins can perform this action' });
  }
  next();
};

// Check if HR user has a specific permission (super_admin always passes)
const requirePermission = (permission) => (req, res, next) => {
  if (req.user.role === 'super_admin') return next();
  if (req.user.role !== 'hr') return res.status(403).json({ error: 'Unauthorized' });

  const db = require('../db');
  const hrUser = db.prepare('SELECT hr_role_id FROM users WHERE id = ?').get(req.user.id);
  if (!hrUser?.hr_role_id) return res.status(403).json({ error: 'No HR role assigned. Contact your Super Admin.' });

  const role = db.prepare('SELECT permissions FROM hr_roles WHERE id = ?').get(hrUser.hr_role_id);
  if (!role) return res.status(403).json({ error: 'HR role not found' });

  let perms = [];
  try { perms = JSON.parse(role.permissions); } catch {}
  if (!perms.includes(permission)) {
    return res.status(403).json({ error: `Your role does not have '${permission}' permission.` });
  }
  next();
};

module.exports = { authenticate, requireEmployer, requireJobseeker, requireHR, requireSuperAdmin, requirePermission, JWT_SECRET };
