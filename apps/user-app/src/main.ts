import { AppModule } from './app.module';
import { BootstrapApp } from '@app/common/helpers/bootstrap.helper';
import { appEnv } from '@app/common/helpers/env.helper';

async function bootstrap() {
  await BootstrapApp({
    appModule: AppModule,
    port: process.env.PORT || appEnv('USER_PORT', 3000),
    appName: 'User',
  });
}

bootstrap();
