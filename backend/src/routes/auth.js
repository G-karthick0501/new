const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// Google OAuth route
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ 
      $or: [{ googleId }, { email }] 
    });

    if (user) {
      // Update Google ID if user exists with same email
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        if (picture) user.avatar = picture;
        await user.save();
      }
    } else {
      // Create new user with default role
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        authProvider: 'google',
        role: 'candidate' // Default role for Google users
      });
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { 
        uid: user._id, 
        email: user.email, 
        role: user.role 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return res.status(400).json({ msg: "Google authentication failed" });
  }
});

// Regular register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ msg: "All fields including role are required" });

    // Validate role
    if (!['candidate', 'hr', 'admin'].includes(role)) {
      return res.status(400).json({ msg: "Invalid role selected" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      if (exists.authProvider === 'google') {
        return res.status(409).json({ 
          msg: "Email already registered with Google. Please use Google Sign-In." 
        });
      }
      return res.status(409).json({ msg: "Email already used" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, 
      email, 
      password: hash, 
      role,
      authProvider: 'local'
    });

    return res.status(201).json({ 
      id: user._id, 
      name: user.name, 
      email: user.email,
      role: user.role
    });
  } catch (e) {
    return res.status(500).json({ msg: "Server error" });
  }
});

// Regular login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: "Invalid credentials" });

    if (user.authProvider === 'google') {
      return res.status(400).json({ 
        msg: "This email is registered with Google. Please use Google Sign-In." 
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ 
      uid: user._id, 
      email: user.email, 
      role: user.role
    }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });
    
    return res.json({
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (e) {
    return res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/auth/me (protected)
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.uid).select("-password");
  res.json(user);
});

// // POST /api/auth/register
// router.post("/register", async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     if (!name || !email || !password)
//       return res.status(400).json({ msg: "All fields are required" });

//     const exists = await User.findOne({ email });
//     if (exists) return res.status(409).json({ msg: "Email already used" });

//     const hash = await bcrypt.hash(password, 10);
//     const user = await User.create({ name, email, password: hash });

//     return res.status(201).json({ id: user._id, name: user.name, email: user.email });
//   } catch (e) {
//     return res.status(500).json({ msg: "Server error" });
//   }
// });

// // POST /api/auth/login
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(401).json({ msg: "Invalid credentials" });

//     const ok = await bcrypt.compare(password, user.password);
//     if (!ok) return res.status(401).json({ msg: "Invalid credentials" });

//     const token = jwt.sign({ uid: user._id, email: user.email }, process.env.JWT_SECRET, {
//       expiresIn: "7d"
//     });
    

//     return res
//     .type("application/json")
//     .json({
//       token,
//       user: { id: user._id, name: user.name, email: user.email }
//     });
//   } catch (e) {
//     return res.status(500).json({ msg: "Server error" });
//   }
// });

// // GET /api/auth/me (protected)
// router.get("/me", auth, async (req, res) => {
//   const user = await User.findById(req.user.uid).select("-password");
//   res.json(user);
// });

// router.post("/google", async (req, res) => {
//   try {
//     const { token } = req.body;
    
//     // Verify Google token
//     const ticket = await googleClient.verifyIdToken({
//       idToken: token,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });
    
//     const payload = ticket.getPayload();
//     const { sub: googleId, email, name, picture } = payload;

//     // Check if user exists
//     let user = await User.findOne({ 
//       $or: [{ googleId }, { email }] 
//     });

//     if (user) {
//       // Update Google ID if user exists with same email
//       if (!user.googleId) {
//         user.googleId = googleId;
//         user.authProvider = 'google';
//         if (picture) user.avatar = picture;
//         await user.save();
//       }
//     } else {
//       // Create new user
//       user = await User.create({
//         name,
//         email,
//         googleId,
//         avatar: picture,
//         authProvider: 'google'
//       });
//     }

//     // Generate JWT
//     const jwtToken = jwt.sign(
//       { uid: user._id, email: user.email }, 
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     return res.json({
//       token: jwtToken,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         avatar: user.avatar
//       }
//     });
//   } catch (error) {
//     console.error('Google OAuth error:', error);
//     return res.status(400).json({ msg: "Google authentication failed" });
//   }
// });

// // Regular register (UPDATED)
// router.post("/register", async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     if (!name || !email || !password)
//       return res.status(400).json({ msg: "All fields are required" });

//     const exists = await User.findOne({ email });
//     if (exists) {
//       if (exists.authProvider === 'google') {
//         return res.status(409).json({ 
//           msg: "Email already registered with Google. Please use Google Sign-In." 
//         });
//       }
//       return res.status(409).json({ msg: "Email already used" });
//     }

//     const hash = await bcrypt.hash(password, 10);
//     const user = await User.create({ 
//       name, 
//       email, 
//       password: hash, 
//       authProvider: 'local'
//     });

//     return res.status(201).json({ 
//       id: user._id, 
//       name: user.name, 
//       email: user.email 
//     });
//   } catch (e) {
//     return res.status(500).json({ msg: "Server error" });
//   }
// });

// // Regular login (UPDATED)
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(401).json({ msg: "Invalid credentials" });

//     // Check if user registered with Google
//     if (user.authProvider === 'google') {
//       return res.status(400).json({ 
//         msg: "This email is registered with Google. Please use Google Sign-In." 
//       });
//     }

//     const ok = await bcrypt.compare(password, user.password);
//     if (!ok) return res.status(401).json({ msg: "Invalid credentials" });

//     const token = jwt.sign({ uid: user._id, email: user.email }, process.env.JWT_SECRET, {
//       expiresIn: "7d"
//     });
    
//     return res.json({
//       token,
//       user: { 
//         id: user._id, 
//         name: user.name, 
//         email: user.email,
//         avatar: user.avatar
//       }
//     });
//   } catch (e) {
//     return res.status(500).json({ msg: "Server error" });
//   }
// });

// // GET /api/auth/me (existing - keep as is)
// router.get("/me", auth, async (req, res) => {
//   const user = await User.findById(req.user.uid).select("-password");
//   res.json(user);
// });

// router.post("/register", async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body; // Add role here

//     if (!name || !email || !password || !role)
//       return res.status(400).json({ msg: "All fields including role are required" });

//     // Validate role
//     if (!['candidate', 'hr', 'admin'].includes(role)) {
//       return res.status(400).json({ msg: "Invalid role selected" });
//     }

//     const exists = await User.findOne({ email });
//     if (exists) {
//       if (exists.authProvider === 'google') {
//         return res.status(409).json({ 
//           msg: "Email already registered with Google. Please use Google Sign-In." 
//         });
//       }
//       return res.status(409).json({ msg: "Email already used" });
//     }

//     const hash = await bcrypt.hash(password, 10);
//     const user = await User.create({ 
//       name, 
//       email, 
//       password: hash, 
//       role, // Include role
//       authProvider: 'local'
//     });

//     return res.status(201).json({ 
//       id: user._id, 
//       name: user.name, 
//       email: user.email,
//       role: user.role // Return role
//     });
//   } catch (e) {
//     return res.status(500).json({ msg: "Server error" });
//   }
// });

// // Update login to return role
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(401).json({ msg: "Invalid credentials" });

//     if (user.authProvider === 'google') {
//       return res.status(400).json({ 
//         msg: "This email is registered with Google. Please use Google Sign-In." 
//       });
//     }

//     const ok = await bcrypt.compare(password, user.password);
//     if (!ok) return res.status(401).json({ msg: "Invalid credentials" });

//     const token = jwt.sign({ 
//       uid: user._id, 
//       email: user.email, 
//       role: user.role // Include role in JWT
//     }, process.env.JWT_SECRET, {
//       expiresIn: "7d"
//     });
    
//     return res.json({
//       token,
//       user: { 
//         id: user._id, 
//         name: user.name, 
//         email: user.email,
//         role: user.role, // Return role
//         avatar: user.avatar
//       }
//     });
//   } catch (e) {
//     return res.status(500).json({ msg: "Server error" });
//   }
// });

module.exports = router;
