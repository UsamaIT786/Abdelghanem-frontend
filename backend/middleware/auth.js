const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_abdelghanem_jwt_secret_token_12345_v2';

/**
 * Middleware: Verify JWT and inject user credentials & header client tenant context
 */
function verifyTokenAndTenant(req, res, next) {
  // Extract tenant context from HTTP header 'x-tenant-id'
  const tenantHeader = req.headers['x-tenant-id'];
  req.tenantId = tenantHeader || 'all'; // Default fallback

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // If authorization header is absent, allow request to route but warn
    // Note: For real environment, reject if securing endpoints
    return res.status(401).json({ error: 'Access denied. Authorization token not provided.' });
  }

  let token;
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    token = authHeader.trim();
  }

  if (!token || token === 'undefined') {
    return res.status(401).json({ error: 'Access denied. Malformed bearer token structure.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    
    // Cross reference and override tenant isolated routes if user is restricted to a tenant
    if (req.user.tenantId && req.user.tenantId !== 'all') {
      req.tenantId = req.user.tenantId;
    }

    next();
  } catch (err) {
    res.status(403).json({ error: 'Session expired or invalid authentication token signature.' });
  }
}

/**
 * Role authorization wrapper
 */
function authorizeRoles(...permittedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    if (req.user.role === 'Admin') {
      return next(); // Super admin bypasses all constraints
    }

    if (permittedRoles.includes(req.user.role)) {
      return next();
    }

    res.status(403).json({ error: 'Insufficient permissions. Required Roles: ' + permittedRoles.join(', ') });
  };
}

module.exports = {
  verifyTokenAndTenant,
  authorizeRoles
};
