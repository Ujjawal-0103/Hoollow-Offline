import { Notification, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma';

export class NotificationNotFoundError extends Error {
  public statusCode = 404;
  constructor(id: string) {
    super(`Notification with ID "${id}" was not found.`);
    this.name = 'NotificationNotFoundError';
  }
}

export class NotificationService {
  constructor(private readonly prismaClient?: PrismaClient) {}

  private get client(): PrismaClient {
    return this.prismaClient ?? getPrismaClient();
  }

  /**
   * Retrieves notifications for a learner, optionally filtered by unread status.
   */
  public async getLearnerNotifications(
    learnerId: string,
    options: { unreadOnly?: boolean } = {}
  ): Promise<Notification[]> {
    const where: any = { learnerId };
    if (options.unreadOnly) {
      where.read = false;
    }

    return this.client.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Marks a single notification as read.
   */
  public async markAsRead(learnerId: string, notificationId: string): Promise<Notification> {
    const notification = await this.client.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.learnerId !== learnerId) {
      throw new NotificationNotFoundError(notificationId);
    }

    return this.client.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }
}

export const notificationService = new NotificationService();
