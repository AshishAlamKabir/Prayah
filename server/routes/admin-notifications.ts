import type { Express } from "express";
import { storage } from "../storage";
import { authMiddleware, adminMiddleware } from "../auth";

export function registerAdminNotificationRoutes(app: Express): void {
  
  // Get notifications for admin user
  app.get("/api/admin/notifications", authMiddleware, async (req: any, res) => {
    try {
      const { unreadOnly } = req.query;
      const adminUserId = req.user.id;
      
      // Only admins and role-based admins can access notifications
      if (!req.user.role || (!req.user.role.includes('admin'))) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const notifications = await storage.getAdminNotifications(
        adminUserId, 
        unreadOnly === 'true'
      );

      res.json(notifications);
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get("/api/admin/notifications/unread-count", authMiddleware, async (req: any, res) => {
    try {
      const adminUserId = req.user.id;
      
      // Only admins and role-based admins can access notifications
      if (!req.user.role || (!req.user.role.includes('admin'))) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const count = await storage.getUnreadNotificationCount(adminUserId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Mark notification as read
  app.post("/api/admin/notifications/:id/mark-read", authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminUserId = req.user.id;
      
      // Only admins and role-based admins can mark notifications
      if (!req.user.role || (!req.user.role.includes('admin'))) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const notification = await storage.markNotificationRead(parseInt(id));
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // Verify the notification belongs to the requesting admin
      if (notification.adminUserId !== adminUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read for admin
  app.post("/api/admin/notifications/mark-all-read", authMiddleware, async (req: any, res) => {
    try {
      const adminUserId = req.user.id;
      
      // Only admins and role-based admins can mark notifications
      if (!req.user.role || (!req.user.role.includes('admin'))) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get all unread notifications for this admin
      const unreadNotifications = await storage.getAdminNotifications(adminUserId, true);
      
      // Mark each as read
      const markReadPromises = unreadNotifications.map(notification => 
        storage.markNotificationRead(notification.id)
      );
      
      await Promise.all(markReadPromises);

      res.json({ 
        success: true, 
        message: `Marked ${unreadNotifications.length} notifications as read` 
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Get payment notifications for admin dashboard
  app.get("/api/admin/payment-notifications", authMiddleware, async (req: any, res) => {
    try {
      const adminUserId = req.user.id;
      
      // Only admins and role-based admins can access payment notifications
      if (!req.user.role || (!req.user.role.includes('admin'))) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get payment-related notifications
      const notifications = await storage.getAdminNotifications(adminUserId);
      const paymentNotifications = notifications.filter(n => 
        n.notificationType === 'payment_received' || n.paymentId
      );

      res.json(paymentNotifications);
    } catch (error) {
      console.error("Error fetching payment notifications:", error);
      res.status(500).json({ message: "Failed to fetch payment notifications" });
    }
  });

  // Create manual notification (admin only)
  app.post("/api/admin/notifications/create", adminMiddleware, async (req: any, res) => {
    try {
      const { 
        adminUserId, 
        notificationType, 
        title, 
        message, 
        priority, 
        relatedEntityType, 
        relatedEntityId,
        paymentId 
      } = req.body;

      if (!adminUserId || !notificationType || !title || !message) {
        return res.status(400).json({ 
          message: "adminUserId, notificationType, title, and message are required" 
        });
      }

      const notification = await storage.createAdminNotification({
        adminUserId,
        notificationType,
        title,
        message,
        priority: priority || 'medium',
        relatedEntityType,
        relatedEntityId,
        paymentId,
      });

      res.json({ 
        success: true, 
        message: "Notification created successfully", 
        notification 
      });
    } catch (error) {
      console.error("Error creating admin notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });
}