import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationModel,
  NotificationType,
} from './models/notification.entity';
import { DateTime } from 'luxon';
import { FirebaseService } from '@app/common/providers/firebase.service';
import { NotificationRepository } from './repositories/notification.repository';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from '@app/common/constants/events.constant';
import { DeviceService } from '@app/device/device.service';
import { NOTIFICATION_TEMPLATES } from '@app/common/constants/notification.constant';

export interface SendNotificationPayload {
  userId: number;
  notificationType: NotificationType;
  templateData?: Record<string, any>;
  additionalInfo?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly firebaseService: FirebaseService,
    private readonly deviceService: DeviceService,
  ) {}

  /**
   * Generic event handler for sending push notifications
   * This is triggered by the 'notification_send' event
   */
  @OnEvent(EVENTS.NOTIFICATION.SEND)
  public async HandleSendNotification(
    payload: SendNotificationPayload,
  ): Promise<NotificationModel | null> {
    const {
      userId,
      notificationType,
      templateData = {},
      additionalInfo,
    } = payload;

    try {
      // Get notification template based on type
      const template = NOTIFICATION_TEMPLATES[notificationType] || null;
      if (!template) {
        this.logger.error(
          `No notification template found for type ${notificationType}`,
        );
        return null;
      }

      const { tokens: deviceTokens, timezone: deviceTimezone } =
        await this.deviceService.GetActiveDeviceTokensWithTimezone(userId);

      // Derive display timezone (fallback to UTC)
      const displayTimezone = deviceTimezone || 'UTC';

      const toUtcDateTime = (value: any) => {
        if (!value) return null;
        if (value instanceof Date) {
          return DateTime.fromJSDate(value, { zone: 'utc' });
        }
        if (typeof value === 'number') {
          return DateTime.fromMillis(value, { zone: 'utc' });
        }
        return DateTime.fromISO(String(value), { zone: 'utc' });
      };

      const formattedTemplateData = { ...templateData };

      const formatDateField = (rawKey: string, formattedKey: string) => {
        const rawValue = (templateData || {})[rawKey];
        if (!rawValue) return;
        const dt = toUtcDateTime(rawValue);
        if (dt?.isValid) {
          formattedTemplateData[formattedKey] = dt
            .setZone(displayTimezone)
            .toFormat('dd MMM yyyy, hh:mm a');
        }
      };

      formatDateField('start_time', 'formattedStartTime');
      formatDateField('end_time', 'formattedEndTime');
      formatDateField('old_start_time', 'oldFormattedStartTime');
      formatDateField('new_start_time', 'newFormattedStartTime');

      // Generate title and message from template
      const title = template.title;
      const message = template.getBody(formattedTemplateData);

      let notification = new NotificationModel();
      notification.user_id = userId;
      notification.notification_type = notificationType;
      notification.notification_title = title;
      notification.notification_message = message;
      notification.additional_info = additionalInfo;

      notification = await this.notificationRepository.Create(notification);

      if (deviceTokens && deviceTokens.length > 0) {
        // Send to all devices using Firebase
        const result = await this.firebaseService.SendToDevices(deviceTokens, {
          title: notification.notification_title?.en,
          body: notification.notification_message.en,
          data: {
            notification_id: notification.id.toString(),
            notification_type: notification.notification_type,
            ...(notification.additional_info || {}),
          },
        });

        this.logger.log(
          `Sent notification ${notification.id} to ${result.successCount}/${deviceTokens.length} devices`,
        );

        // Deactivate invalid tokens
        if (result.invalidTokens.length > 0) {
          this.logger.warn(
            `Deactivating ${result.invalidTokens.length} invalid device tokens`,
          );
          await this.deviceService.DeactivateDeviceByTokens(
            result.invalidTokens,
          );
        }
      }

      return notification;
    } catch (error) {
      this.logger.error(`Error sending notification to user ${userId}:`, error);
      return null;
    }
  }
}
