const jwt = require("jsonwebtoken");

function requireRole(allowedRoles) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    
    if (!token) return res.status(401).json({ msg: "No token provided" });

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
      
      // Check if user has required role
      if (!allowedRoles.includes(payload.role)) {
        return res.status(403).json({ msg: "Access denied. Insufficient permissions." });
      }
      
      next();
    } catch {
      return res.status(401).json({ msg: "Invalid token" });
    }
  };
}

module.exports = { requireRole };