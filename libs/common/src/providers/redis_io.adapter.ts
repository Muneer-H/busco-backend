import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createShardedAdapter } from '@socket.io/redis-adapter';
import { createClient, RedisClientType } from 'redis';
import { Server, ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createShardedAdapter>;
  private pubClient: RedisClientType;
  private subClient: RedisClientType;
  private configService: ConfigService;

  constructor(app: INestApplicationContext) {
    super(app);
    this.configService = app.get(ConfigService, { strict: false });
  }

  public async connectToRedis(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisPrefix = this.configService.get<string>('REDIS_PREFIX');
    const channelPrefix = `${redisPrefix}:socket.io`;

    this.pubClient = createClient({ url: redisUrl });
    this.subClient = this.pubClient.duplicate();

    await Promise.all([this.pubClient.connect(), this.subClient.connect()]);
    this.adapterConstructor = createShardedAdapter(
      this.pubClient,
      this.subClient,
      {
        channelPrefix,
      },
    );
  }

  public createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    if (!this.adapterConstructor) {
      throw new Error(
        'RedisIoAdapter not connected. Call connectToRedis() before creating server.',
      );
    }
    server.adapter(this.adapterConstructor);
    return server;
  }

  public async close(server: Server): Promise<void> {
    await super.close(server);
    try {
      await Promise.all([this.pubClient?.quit(), this.subClient?.quit()]);
    } catch {}
  }
}
