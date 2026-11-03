import * as notificationService from '../services/notificationService.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, isRead, type } = req.query;
    const result = await notificationService.getUserNotifications(req.user._id, {
      page,
      limit,
      isRead,
      type,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const result = await notificationService.getUnreadCount(req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.user._id, req.params.id);
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(404);
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    res.json({ success: true, message: 'All notifications marked as read', data: result });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.user._id, req.params.id);
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(404);
    next(error);
  }
};

export const generateNotifications = async (req, res, next) => {
  try {
    await notificationService.generateAutoNotifications(req.user._id);
    const result = await notificationService.getUserNotifications(req.user._id);
    res.json({ success: true, message: 'Notifications synced successfully', data: result });
  } catch (error) {
    next(error);
  }
};

export const createTestNotification = async (req, res, next) => {
  try {
    const { title, message, type, link, dedupKey } = req.body;
    const result = await notificationService.createNotification(req.user._id, {
      title: title || 'Test Notification',
      message: message || 'This is a test in-app notification.',
      type: type || 'system',
      link: link || '/notifications',
      dedupKey: dedupKey || `test_${req.user._id}_${Date.now()}`,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
