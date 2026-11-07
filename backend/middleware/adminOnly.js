/**
 * adminOnly middleware — must come AFTER auth middleware.
 * Verifies role from the JWT payload (server-side only, never from request body).
 */
module.exports = function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};
