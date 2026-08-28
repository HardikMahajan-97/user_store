import express from "express";
import {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  broadcastJobNotifications,
} from "../controllers/notification.controller.js";
import { authenticate, authorize } from "../middlewares/middleware.js";

const router = express.Router();

router.post("/", authenticate, authorize("admin"), createNotification);

router.get("/", authenticate, getNotifications);

router.get("/unread-count", authenticate, getUnreadCount);

router.patch("/:notificationId/read", authenticate, markNotificationAsRead);

router.patch("/mark-all-read", authenticate, markAllNotificationsAsRead);

router.post("/broadcast/job", authenticate, authorize("admin"), broadcastJobNotifications);

router.delete("/:notificationId", authenticate, deleteNotification);

export default router;
