const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ msg: "No token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.uid);
    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }
    
    req.user = { uid: user._id, email: user.email, role: user.role }; // Attach uid, email, and role
    next();
  } catch {
    return res.status(401).json({ msg: "Invalid token" });
  }
}

module.exports = auth;