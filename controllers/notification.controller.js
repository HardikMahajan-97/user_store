import Notification from "../models/notification.model.js";

export const createNotification = async (req, res) => {
  const {
    recipient,
    type,
    title,
    message,
    relatedJob,
    relatedApplication,
    relatedCompany,
    actionLink,
  } = req.body;

  if (!recipient || !type || !title || !message) {
    return res.status(400).json({
      message: "Recipient, type, title, and message are required",
    });
  }

  const validTypes = [
    "job_posted",
    "application_received",
    "shortlisted",
    "rejected",
    "selected",
    "shortlisting_complete",
  ];

  if (!validTypes.includes(type)) {
    return res.status(400).json({
      message: "Invalid notification type",
    });
  }

  try {
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedJob,
      relatedApplication,
      relatedCompany,
      actionLink,
    });

    res.status(201).json({
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getNotifications = async (req, res) => {
  const userId = req.user._id;
  const { isRead } = req.query;

  try {
    const filter = { recipient: userId };

    if (isRead !== undefined) {
      filter.isRead = isRead === "true";
    }

    const notifications = await Notification.find(filter)
      .populate("relatedJob", "jobRole")
      .populate("relatedCompany", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Notifications fetched successfully",
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  const userId = req.user._id;

  try {
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteNotification = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getUnreadCount = async (req, res) => {
  const userId = req.user._id;

  try {
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.status(200).json({
      message: "Unread count fetched successfully",
      unreadCount: count,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const broadcastJobNotifications = async (req, res) => {
  const { jobId, recipientRole } = req.body;

  if (!jobId || !recipientRole) {
    return res.status(400).json({
      message: "Job ID and recipient role are required",
    });
  }

  try {
    const User = (await import("../models/user.model.js")).default;

    const recipients = await User.find({ role: recipientRole });

    const notifications = [];

    for (const recipient of recipients) {
      const notification = await Notification.create({
        recipient: recipient._id,
        type: "job_posted",
        title: "New Job Opportunity",
        message: "A new job has been posted. Check it out!",
        relatedJob: jobId,
        actionLink: `/jobs/${jobId}`,
      });

      notifications.push(notification);
    }

    res.status(200).json({
      message: "Notifications broadcasted successfully",
      count: notifications.length,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
