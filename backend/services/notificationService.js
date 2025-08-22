const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../config/logger');

class NotificationService {
  constructor() {
    this.emailEnabled = process.env.EMAIL_ENABLED === 'true';
    this.smsEnabled = process.env.SMS_ENABLED === 'true';
  }

  // Create and send notification
  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();

      // Send immediate notifications for high priority items
      if (notification.priority === 'critical' || notification.priority === 'high') {
        await this.sendImmediateNotification(notification);
      }

      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  // Send immediate notification via multiple channels
  async sendImmediateNotification(notification) {
    try {
      const user = await User.findById(notification.userId);
      if (!user) return;

      const promises = [];

      // Send email notification
      if (this.emailEnabled && user.email) {
        promises.push(this.sendEmailNotification(user, notification));
      }

      // Send SMS for critical notifications
      if (this.smsEnabled && notification.priority === 'critical' && user.phone) {
        promises.push(this.sendSMSNotification(user, notification));
      }

      await Promise.allSettled(promises);
    } catch (error) {
      logger.error('Failed to send immediate notification:', error);
    }
  }

  // Send email notification (placeholder - integrate with actual email service)
  async sendEmailNotification(user, notification) {
    try {
      // This would integrate with services like SendGrid, AWS SES, etc.
      logger.info(`Email notification sent to ${user.email}: ${notification.title}`);
      
      // Record notification sent
      notification.notifications = notification.notifications || [];
      notification.notifications.push({
        recipientId: user._id,
        notificationType: 'immediate',
        sentDate: new Date(),
        method: 'email'
      });
      
      await notification.save();
    } catch (error) {
      logger.error('Failed to send email notification:', error);
    }
  }

  // Send SMS notification (placeholder - integrate with actual SMS service)
  async sendSMSNotification(user, notification) {
    try {
      // This would integrate with services like Twilio, AWS SNS, etc.
      logger.info(`SMS notification sent to ${user.phone}: ${notification.title}`);
      
      // Record notification sent
      notification.notifications = notification.notifications || [];
      notification.notifications.push({
        recipientId: user._id,
        notificationType: 'immediate',
        sentDate: new Date(),
        method: 'sms'
      });
      
      await notification.save();
    } catch (error) {
      logger.error('Failed to send SMS notification:', error);
    }
  }

  // Create maintenance due notification
  async createMaintenanceNotification(maintenance, type = 'maintenance_due') {
    const titles = {
      maintenance_due: 'Maintenance Due',
      maintenance_overdue: 'Maintenance Overdue'
    };
    
    const messages = {
      maintenance_due: `Maintenance scheduled for ${maintenance.assetId.name} (${maintenance.assetId.serialNumber}) is due on ${maintenance.scheduledDate.toDateString()}`,
      maintenance_overdue: `Maintenance for ${maintenance.assetId.name} (${maintenance.assetId.serialNumber}) is overdue since ${maintenance.scheduledDate.toDateString()}`
    };
    
    return await this.createNotification({
      userId: maintenance.assignedTo,
      type,
      title: titles[type],
      message: messages[type],
      priority: type === 'maintenance_overdue' ? 'high' : 'medium',
      actionRequired: true,
      actionUrl: `/maintenance/${maintenance._id}`,
      actionLabel: 'View Maintenance',
      relatedEntity: {
        type: 'Maintenance',
        id: maintenance._id,
        name: maintenance.title
      },
      baseId: maintenance.baseId,
      metadata: {
        assetId: maintenance.assetId._id,
        maintenanceType: maintenance.maintenanceType
      }
    });
  }

  // Create inventory low stock notification
  async createInventoryNotification(inventory, threshold) {
    return await this.createNotification({
      userId: inventory.responsibleOfficer,
      type: 'low_inventory',
      title: 'Low Inventory Alert',
      message: `${inventory.assetName} inventory is low (${inventory.currentQuantity} remaining, threshold: ${threshold})`,
      priority: inventory.currentQuantity === 0 ? 'critical' : 'high',
      actionRequired: true,
      actionUrl: `/inventory/${inventory._id}`,
      actionLabel: 'Manage Inventory',
      relatedEntity: {
        type: 'Inventory',
        id: inventory._id,
        name: inventory.assetName
      },
      baseId: inventory.baseId,
      metadata: {
        currentQuantity: inventory.currentQuantity,
        threshold: threshold
      }
    });
  }

  // Create transfer notification
  async createTransferNotification(transaction, type, recipientId) {
    const titles = {
      transfer_request: 'Transfer Request',
      transfer_approved: 'Transfer Approved',
      transfer_rejected: 'Transfer Rejected'
    };
    
    const messages = {
      transfer_request: `New transfer request for ${transaction.assetName} from ${transaction.fromBase.name}`,
      transfer_approved: `Transfer of ${transaction.assetName} has been approved`,
      transfer_rejected: `Transfer of ${transaction.assetName} has been rejected`
    };
    
    return await this.createNotification({
      userId: recipientId,
      type,
      title: titles[type],
      message: messages[type],
      priority: 'medium',
      actionRequired: type === 'transfer_request',
      actionUrl: `/transfers/${transaction._id}`,
      actionLabel: type === 'transfer_request' ? 'Review Request' : 'View Transfer',
      relatedEntity: {
        type: 'Transaction',
        id: transaction._id,
        name: `Transfer: ${transaction.assetName}`
      },
      baseId: transaction.toBase,
      metadata: {
        transactionType: transaction.type,
        quantity: transaction.quantity
      }
    });
  }

  // Create incident notification
  async createIncidentNotification(incident, recipientIds) {
    const notifications = [];
    
    for (const recipientId of recipientIds) {
      const notification = await this.createNotification({
        userId: recipientId,
        type: 'system_alert',
        title: `Incident Reported: ${incident.title}`,
        message: `${incident.incidentType} incident reported at ${incident.location.specificLocation}. Severity: ${incident.severity}`,
        priority: incident.severity === 'critical' || incident.severity === 'catastrophic' ? 'critical' : 'high',
        actionRequired: true,
        actionUrl: `/incidents/${incident._id}`,
        actionLabel: 'View Incident',
        relatedEntity: {
          type: 'Incident',
          id: incident._id,
          name: incident.title
        },
        baseId: incident.location.baseId,
        metadata: {
          incidentType: incident.incidentType,
          severity: incident.severity
        }
      });
      
      notifications.push(notification);
    }
    
    return notifications;
  }

  // Create training due notification
  async createTrainingNotification(training, participantId, type = 'training_due') {
    const titles = {
      training_due: 'Training Due',
      training_reminder: 'Training Reminder',
      certificate_expiring: 'Certificate Expiring'
    };
    
    return await this.createNotification({
      userId: participantId,
      type: 'training_due',
      title: titles[type],
      message: `Training "${training.title}" is scheduled. Please complete your enrollment.`,
      priority: 'medium',
      actionRequired: true,
      actionUrl: `/training/${training._id}`,
      actionLabel: 'View Training',
      relatedEntity: {
        type: 'Training',
        id: training._id,
        name: training.title
      },
      baseId: training.baseId
    });
  }

  // Get unread notifications for user
  async getUnreadNotifications(userId) {
    try {
      return await Notification.findUnreadForUser(userId);
    } catch (error) {
      logger.error('Failed to get unread notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification || notification.userId.toString() !== userId.toString()) {
        throw new Error('Notification not found or access denied');
      }
      
      return await notification.markAsRead(userId);
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId) {
    try {
      return await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications() {
    try {
      const result = await Notification.cleanupExpired();
      logger.info(`Cleaned up ${result.modifiedCount} expired notifications`);
      return result;
    } catch (error) {
      logger.error('Failed to cleanup expired notifications:', error);
      throw error;
    }
  }

  // Send daily digest notifications
  async sendDailyDigest() {
    try {
      // Get all users with unread notifications
      const usersWithNotifications = await Notification.aggregate([
        {
          $match: {
            isRead: false,
            isActive: true,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
          }
        },
        {
          $group: {
            _id: '$userId',
            count: { $sum: 1 },
            highPriorityCount: {
              $sum: {
                $cond: [{ $in: ['$priority', ['high', 'critical']] }, 1, 0]
              }
            }
          }
        }
      ]);

      for (const userNotification of usersWithNotifications) {
        const user = await User.findById(userNotification._id);
        if (user && user.email) {
          await this.sendDailyDigestEmail(user, userNotification);
        }
      }

      logger.info(`Sent daily digest to ${usersWithNotifications.length} users`);
    } catch (error) {
      logger.error('Failed to send daily digest:', error);
    }
  }

  // Send daily digest email (placeholder)
  async sendDailyDigestEmail(user, notificationSummary) {
    try {
      logger.info(`Daily digest sent to ${user.email}: ${notificationSummary.count} notifications, ${notificationSummary.highPriorityCount} high priority`);
    } catch (error) {
      logger.error('Failed to send daily digest email:', error);
    }
  }

  // Schedule periodic tasks
  startPeriodicTasks() {
    // Clean up expired notifications every hour
    setInterval(() => {
      this.cleanupExpiredNotifications();
    }, 60 * 60 * 1000);

    // Send daily digest at 8 AM
    const now = new Date();
    const eightAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
    if (eightAM <= now) {
      eightAM.setDate(eightAM.getDate() + 1);
    }
    
    const timeUntilEightAM = eightAM.getTime() - now.getTime();
    
    setTimeout(() => {
      this.sendDailyDigest();
      // Then repeat every 24 hours
      setInterval(() => {
        this.sendDailyDigest();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilEightAM);

    logger.info('Notification service periodic tasks started');
  }
}

module.exports = new NotificationService();
