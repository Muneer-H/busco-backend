export const EVENTS = {
  NOTIFICATION: {
    SEND: 'notification_send',
  },
} as const;

export type EventName =
  (typeof EVENTS)[keyof typeof EVENTS][keyof (typeof EVENTS)[keyof typeof EVENTS]];
