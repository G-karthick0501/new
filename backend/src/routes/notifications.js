const express = require("express");
const auth = require("../middleware/auth");
const Notification = require("../models/Notification");

const router = express.Router();

// Get user's notifications
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.uid })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch notifications" });
  }
});

// Mark as read
router.patch("/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.uid },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ msg: "Not found" });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ msg: "Failed to update" });
  }
});

// Delete notification
router.delete("/:id", auth, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.uid });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ msg: "Failed to delete" });
  }
});


// Test route - create a notification
router.post("/test", auth, async (req, res) => {
  try {
    const { createNotification } = require("../services/notificationService");
    const notification = await createNotification(req.user.uid, {
      type: "success",
      title: "Test Notification",
      message: "This is a test notification from the system!",
      sendEmailNotification: true
    });
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ msg: "Test failed", error: error.message });
  }
});

// Debug route
router.get("/debug", auth, async (req, res) => {
  try {
    const all = await Notification.find({});
    const mine = await Notification.find({ userId: req.user.uid });
    res.json({ 
      userIdFromToken: req.user.uid,
      allNotifications: all,
      myNotifications: mine
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;