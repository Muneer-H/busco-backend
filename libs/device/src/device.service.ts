import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DeviceModel, IDeviceToken } from './models/device.entity';
import { RegisterDeviceDto, UpdateDeviceDto } from './dtos/device.dto';
import { DeviceRepository } from './repositories/device.repository';
import { RedisRepository } from '@app/common/providers/redis.repository';
import { In } from 'typeorm';

@Injectable()
export class DeviceService {
  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly jwtService: JwtService,
    private readonly redisRepository: RedisRepository,
  ) {}

  // Key to lookup token by device ID (for invalidation)
  private getDeviceTokenKey(deviceId: number) {
    return `device:id:${deviceId}`;
  }

  // Key to lookup device ID by token (for validation)
  private getTokenDeviceKey(token: string) {
    return `device:token:${token}`;
  }

  public async RegisterDevice(
    body: RegisterDeviceDto,
  ): Promise<{ device: DeviceModel; token: string }> {
    await this.deviceRepository.Delete(
      { firebase_token: body.firebase_token },
      true,
    );

    const deviceModel = new DeviceModel();
    deviceModel.firebase_token = body.firebase_token;
    deviceModel.device_type = body.device_type;
    deviceModel.device_name = body.device_name;
    deviceModel.device_model = body.device_model;
    deviceModel.os_version = body.os_version;
    deviceModel.app_version = body.app_version || '0.0.0';
    deviceModel.timezone = body.timezone;
    deviceModel.user_agent = body.user_agent;
    deviceModel.is_active = true;
    deviceModel.last_active_at = Date.now();

    const savedDevice = await this.deviceRepository.Save(deviceModel);

    // Invalidate old token if exists
    await this.invalidateDeviceToken(savedDevice.id);

    // Generate JWT token for device
    const payload: IDeviceToken = {
      id: savedDevice.id,
      iat: Date.now(),
      sending_attempts: 0,
      last_sending_attempt_at: null,
    };

    const token = this.jwtService.sign(payload);

    // Save both keys in Redis for bidirectional lookup
    await Promise.all([
      this.redisRepository.Set(this.getDeviceTokenKey(savedDevice.id), token),
      this.redisRepository.Set(
        this.getTokenDeviceKey(token),
        savedDevice.id.toString(),
      ),
    ]);

    return {
      device: savedDevice,
      token,
    };
  }

  private async invalidateDeviceToken(deviceId: number): Promise<void> {
    // Get the old token for this device
    const oldToken = await this.redisRepository.Get(
      this.getDeviceTokenKey(deviceId),
    );

    if (oldToken) {
      // Delete both keys
      await Promise.all([
        this.redisRepository.Delete(this.getDeviceTokenKey(deviceId)),
        this.redisRepository.Delete(this.getTokenDeviceKey(oldToken)),
      ]);
    }
  }

  public async UpdateDevice(
    deviceId: number,
    updateDeviceDto: UpdateDeviceDto,
  ): Promise<DeviceModel> {
    const deviceModel = await this.deviceRepository.FindOne({
      id: deviceId,
    });

    if (!deviceModel) {
      throw new BadRequestException('Device not found');
    }

    deviceModel.firebase_token =
      updateDeviceDto.firebase_token || deviceModel.firebase_token;
    deviceModel.os_version =
      updateDeviceDto.os_version || deviceModel.os_version;
    deviceModel.app_version =
      updateDeviceDto.app_version || deviceModel.app_version;
    deviceModel.timezone = updateDeviceDto.timezone || deviceModel.timezone;
    deviceModel.user_agent =
      updateDeviceDto.user_agent || deviceModel.user_agent;
    deviceModel.is_active =
      updateDeviceDto.is_active !== undefined
        ? updateDeviceDto.is_active
        : deviceModel.is_active;
    deviceModel.last_active_at = Date.now();

    return await this.deviceRepository.Save(deviceModel);
  }

  public async AssignOwnerToDevice(
    deviceId: number,
    ownerId: number,
  ): Promise<void> {
    const currentTimestamp = Date.now();
    const affectedRows = await this.deviceRepository.Update(
      { id: deviceId, is_deleted: false },
      {
        owner_id: ownerId,
        updated_at: currentTimestamp,
        last_active_at: currentTimestamp,
      },
    );

    if (affectedRows.affected === 0) {
      throw new BadRequestException('Device not found');
    }
  }

  public async LogoutDevice(deviceId: number): Promise<void> {
    await Promise.all([
      this.invalidateDeviceToken(deviceId),
      this.deviceRepository.Update(
        { id: deviceId },
        { is_active: false, updated_at: Date.now() },
      ),
    ]);
  }

  public async DeactivateDeviceByTokens(deviceTokens: string[]) {
    return this.deviceRepository.Update(
      { firebase_token: In(deviceTokens) },
      { is_active: false, updated_at: Date.now() },
    );
  }

  public async GetActiveDeviceTokensWithTimezone(
    ownerId: number,
  ): Promise<{ tokens: string[]; timezone?: string }> {
    const devices = await this.deviceRepository.Find(
      {
        owner_id: ownerId,
        is_deleted: false,
        is_active: true,
      },
      undefined,
      ['firebase_token', 'timezone', 'updated_at'],
    );

    const tokens = devices.map((device) => device.firebase_token);

    let selectedTimezone: string | undefined;
    let latestUpdatedAt = -Infinity;
    for (const device of devices) {
      const deviceUpdatedAt = Number(device.updated_at || 0);
      if (device.timezone && deviceUpdatedAt >= latestUpdatedAt) {
        selectedTimezone = device.timezone;
        latestUpdatedAt = deviceUpdatedAt;
      }
    }

    return { tokens, timezone: selectedTimezone };
  }
}
