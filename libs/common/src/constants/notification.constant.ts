import {
  NotificationType,
  INotificationBody,
  INotificationTitle,
} from '../../../notification/src/models/notification.entity';

export interface INotificationTemplate {
  title?: INotificationTitle;
  getBody: (data: Record<string, any>) => INotificationBody;
}

export const NOTIFICATION_TEMPLATES: Record<
  NotificationType,
  INotificationTemplate
> = {
  [NotificationType.WELCOME]: {
    title: { en: 'Welcome to Busco' },
    getBody: (data) => ({
      en: `Welcome ${data.name || 'User'}! We are glad to have you.`,
    }),
  },
};
