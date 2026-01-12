import { appEnv } from '@app/common/helpers/env.helper';
import helmet from 'helmet';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import InitializeSwagger from './documentation.helper';
import morgan from 'morgan';
import { NestExpressApplication } from '@nestjs/platform-express';
import { RedisIoAdapter } from '@app/common/providers/redis_io.adapter';
import { ResponseInterceptor } from '@app/common/interceptors/response.interceptor';
import fs from 'fs';
import path from 'path';
import { NormalizeQueryPipe } from '../pipes/normalize_query.pipe';
import { Settings } from 'luxon';
import admin from 'firebase-admin';

export interface AppBootstrapConfig {
  /** The main application module */
  appModule: any;
  /** Port environment variable name */
  port: number;
  /** Application name for console messages */
  appName: string;
  /** Global prefix for routes (default: 'api') */
  globalPrefix?: string;
}

/**
 * Creates and configures a NestJS application with common setup
 */
export async function createBootstrappedApp(config: AppBootstrapConfig) {
  // Initialize Firebase Admin SDK
  if (!admin.apps.length) {
    const FIREBASE_SERVICE_ACCOUNT = JSON.parse(
      Buffer.from(appEnv('FIREBASE_SERVICE_ACCOUNT'), 'base64').toString(
        'utf8',
      ),
    );
    admin.initializeApp({
      credential: admin.credential.cert(FIREBASE_SERVICE_ACCOUNT),
    });
  }
  const app = await NestFactory.create<NestExpressApplication>(
    config.appModule,
    {
      logger: ['error', 'warn'],
    },
  );

  const isProduction = appEnv('ENVIRONMENT') === 'production';
  app.use(
    helmet({
      // Disable COOP/OAC/COEP in non-trustworthy dev contexts (e.g., HTTP on LAN IP)
      crossOriginOpenerPolicy: isProduction ? { policy: 'same-origin' } : false,
      originAgentCluster: isProduction,
      crossOriginEmbedderPolicy: isProduction
        ? { policy: 'require-corp' }
        : false,
      // Swagger often loads inline/styles/scripts in dev; disable CSP there
      contentSecurityPolicy: isProduction ? undefined : false,
    }),
  );

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));
  app.useGlobalPipes(
    new NormalizeQueryPipe(),
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.enableCors();
  app.use(morgan('dev'));
  app.setGlobalPrefix(config.globalPrefix || 'api');

  app.disable('x-powered-by');

  // Conditional Swagger
  if (appEnv('API_DOC_ENABLED', false)) {
    InitializeSwagger(app, config.appName);
  }

  Settings.defaultZone = 'UTC';

  // Setup Socket.IO Redis adapter
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  const server = app.getHttpServer();
  server.keepAliveTimeout = 30000; // 30 seconds
  server.headersTimeout = 35000; // 35 seconds

  // Health check endpoint (outside global prefix)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/health', (_req: any, res: any) => {
    res.status(200).json({ status: 'ok' });
  });

  return app;
}

/**
 * Starts the application and sets up common event handlers
 */
export async function startApp(app: any, config: AppBootstrapConfig) {
  await app.listen(config.port, async () => {
    console.log(
      '%s app is running at http://localhost:%d',
      config.appName,
      config.port,
    );
    console.log('Press CTRL-C to stop\n');
  });

  // Common error handling
  process.on('unhandledRejection', (error) => {
    console.log(error);
  });
}

/**
 * Complete bootstrap function that creates and starts the app
 */
export async function BootstrapApp(config: AppBootstrapConfig) {
  const app = await createBootstrappedApp(config);
  await startApp(app, config);
  return app;
}
