import { applyDecorators, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { appEnv } from '../helpers/env.helper';

/**
 * Apply throttling to public endpoints
 * Default values from env: THROTTLE_LIMIT (default: 10), THROTTLE_TTL (default: 60000ms)
 * For sensitive endpoints (auth, OTP, contact forms), use tighter limits: PublicThrottle(3, 60000)
 */
export function PublicThrottle(
  limit = appEnv('THROTTLE_LIMIT', 10),
  ttl = appEnv('THROTTLE_TTL', 60000),
) {
  return applyDecorators(
    Throttle({ default: { limit, ttl } }),
    UseGuards(ThrottlerGuard),
  );
}
