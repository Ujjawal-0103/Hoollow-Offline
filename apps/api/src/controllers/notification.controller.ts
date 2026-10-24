import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';

function extractParamId(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0];
  return param ?? '';
}

export class NotificationController {
  public async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const learnerId = extractParamId(req.params.id);
      const unreadOnly = req.query.unread === 'true';

      const notifications = await notificationService.getLearnerNotifications(learnerId, {
        unreadOnly,
      });

      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (err) {
      next(err);
    }
  }

  public async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const learnerId = extractParamId(req.params.id);
      const notificationId = extractParamId(req.params.notificationId);

      const updated = await notificationService.markAsRead(learnerId, notificationId);

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
