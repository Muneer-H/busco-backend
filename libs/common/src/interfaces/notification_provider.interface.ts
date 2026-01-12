export interface PushNotificationPayload {
  title?: string;
  body: string;
  imageUrl?: string;
  deepLink?: string;
  data?: Record<string, string>;
}

export interface NotificationSendResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

export interface INotificationProvider {
  SendToDevices(
    deviceTokens: string[],
    payload: PushNotificationPayload,
  ): Promise<NotificationSendResult>;
}
