import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
  type WsResponse,
} from '@nestjs/websockets';
import { ModuleRef } from '@nestjs/core';
import { Server, Socket } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SocketClientEventName } from '../enums/socket_client_event.enum';
import { IRedisUser } from '@app/user/models/user.entity';
import { IRedisAdmin } from '@app/admin/models/admin.entity';

export enum SocketEventName {
  Authorize = 'auth',
}

@WebSocketGateway({
  path: '/socket.io',
  cors: {
    origin: [
      'http://localhost:3004',
      'https://dev-admin.busco.app', // TODO: Fix busco domain
      'https://admin.busco.app',
    ],
    credentials: true,
  },
})
export class SocketEventGateway
  implements
    OnGatewayInit<Server>,
    OnGatewayConnection<Socket>,
    OnGatewayDisconnect<Socket>
{
  constructor(
    private moduleRef: ModuleRef,
    private configService: ConfigService,
  ) {
    this.jwtService = new JwtService({
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
    });
  }

  @WebSocketServer()
  private server: Server;

  private jwtService: JwtService;
  private appName: string;

  afterInit() {
    console.info('Socket.IO Initialized');
    this.appName = this.moduleRef.get('APP_NAME', { strict: false });

    if (this.configService.get<boolean>('SERVE_SOCKET_IO_ADMIN_UI', false)) {
      instrument(this.server, {
        auth: false,
        mode: 'development',
      });
    }
  }

  private async DecodeToken<T extends object>(token: string): Promise<T> {
    try {
      return await this.jwtService.verifyAsync<T>(token);
    } catch (error) {
      throw new WsException('Invalid or expired token');
    }
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    console.log('Socket Client Connected', client.id);
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log('Socket Client Disconnected', client.id);
    //await this.userService.DeleteSocketInfo(client.id);
  }

  @SubscribeMessage(SocketEventName.Authorize)
  async onAuthorize(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: any,
  ): Promise<WsResponse<Record<string, any>>> {
    console.log(
      'Authorizing Socket Client',
      client.id,
      'for app:',
      this.appName,
    );

    const token = body.token;

    if (!token) {
      throw new WsException('Token is required');
    }

    try {
      let user;
      switch (this.appName) {
        case 'USER':
          user = await this.DecodeToken<IRedisUser>(body.token);
          client.join(`user:${user.id}`);
          break;
        case 'ADMIN':
          user = await this.DecodeToken<IRedisAdmin>(body.token);
          client.join(`admin:${user.id}`);
          break;
        default:
          throw new WsException('Unknown application');
      }
    } catch (error) {
      console.error(error);
      if (error instanceof WsException) {
        throw error;
      }
      throw new WsException('Authorization failed');
    }

    return {
      event: SocketClientEventName.AuthorizeSuccess,
      data: {
        message: 'Authorized',
      },
    };
  }

  public SendSocketEvent(
    event: SocketClientEventName,
    room: string | string[],
    data: any,
  ) {
    this.server.to(room).emit(event, data);
  }
}
