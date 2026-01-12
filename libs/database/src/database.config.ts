import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import fs from 'fs';
import path from 'path';
import { appEnv } from '@app/common/helpers/env.helper';

export const config: TypeOrmModuleOptions = {
  type: 'postgres',
  url: appEnv('DB_POSTGRES_URL'),
  logging: ['error'], //["query", "error"],
  migrationsRun: false,
  entities: [path.join(__dirname, '../../../**/*.entity{.ts,.js}')],
  migrations: [
    path.join(__dirname, '../../../../libs/database/src/migration/*.js'),
  ],
  synchronize: false, // Use migrations in prod
  extra: {
    max: appEnv('DB_POSTGRES_POOL_MAX', 10),
    ...(appEnv('DB_POSTGRES_HOST') != 'localhost' && {
      ssl: {
        rejectUnauthorized: false,
      },
    }),
  },
  ...(appEnv('ENVIRONMENT') !== 'development' && {
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync(path.join(__dirname, './me-central-1-bundle.pem')), // will be downloaded in docker_entrypoint.sh
    },
  }),
  retryAttempts: 3,
};
