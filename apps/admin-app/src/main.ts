import { AppModule } from './app.module';
import { BootstrapApp } from '@app/common/helpers/bootstrap.helper';
import { appEnv } from '@app/common/helpers/env.helper';

async function bootstrap() {
  await BootstrapApp({
    appModule: AppModule,
    port: appEnv('ADMIN_PORT', 3004),
    appName: 'Admin',
  });
}

bootstrap();
