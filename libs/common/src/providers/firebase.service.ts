import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import admin from 'firebase-admin';
import { MulticastMessage, BatchResponse } from 'firebase-admin/messaging';
import {
  INotificationProvider,
  NotificationSendResult,
  PushNotificationPayload,
} from '../interfaces/notification_provider.interface';

@Injectable()
export class FirebaseService implements INotificationProvider, OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private messaging: admin.messaging.Messaging;

  onModuleInit() {
    try {
      // Firebase is already initialized in bootstrap.helper.ts
      // Just get the messaging instance from the existing admin app
      if (admin.apps.length > 0) {
        this.messaging = admin.messaging();
        this.logger.log('Firebase Messaging service initialized successfully');
      } else {
        this.logger.error(
          'Firebase Admin SDK not initialized. Please check bootstrap.helper.ts',
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to initialize Firebase Messaging service:',
        error,
      );
    }
  }

  public async SendToDevices(
    firebaseTokens: string[],
    payload: PushNotificationPayload,
  ): Promise<NotificationSendResult> {
    if (!this.messaging) {
      this.logger.error('Firebase messaging not initialized');
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    if (!firebaseTokens || firebaseTokens.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    // Filter out invalid tokens (basic validation)
    const validTokens = firebaseTokens.filter(
      (token) => token && token.length > 0,
    );

    if (validTokens.length === 0) {
      this.logger.warn('No valid Firebase tokens found');
      return {
        successCount: 0,
        failureCount: firebaseTokens.length,
        invalidTokens: firebaseTokens,
      };
    }

    Object.keys(payload.data).forEach((key) => {
      payload.data[key] = payload.data[key].toString();
    });

    const message: MulticastMessage = {
      tokens: validTokens,
      notification: {
        title: payload.title || '',
        body: payload.body,
        ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
      },
      data: payload.data || undefined,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    try {
      const response: BatchResponse =
        await this.messaging.sendEachForMulticast(message);

      const invalidTokens: string[] = [];

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error;

          // Check for invalid registration tokens
          if (
            error?.code === 'messaging/invalid-registration-token' ||
            error?.code === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(validTokens[idx]);
          }

          this.logger.error(
            `Error sending to ${validTokens[idx]}: ${error?.message}`,
          );
        }
      });

      this.logger.log(
        `Successfully sent ${response.successCount} messages, failed ${response.failureCount}`,
      );

      if (invalidTokens.length > 0) {
        this.logger.warn(
          `Found ${invalidTokens.length} invalid tokens that should be removed`,
        );
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      };
    } catch (error) {
      this.logger.error('Error sending multicast message:', error);
      return {
        successCount: 0,
        failureCount: validTokens.length,
        invalidTokens: [],
      };
    }
  }
}
