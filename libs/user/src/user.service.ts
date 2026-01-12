import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { JwtService } from '@nestjs/jwt';
import { IRedisUser, UserModel } from './models/user.entity';
import admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { AuthenticateDto, UpdateMeDto } from './dtos/user.dto';
import { RedisRepository } from '@app/common/providers/redis.repository';
import { MailService } from '@app/common/providers/mail.service';
import { GetVerificationCode } from '@app/common/helpers/misc.helper';
import { appEnv } from '@app/common/helpers/env.helper';
import {
  DeleteAWSFile,
  GetAWSSignedUrl,
} from '@app/common/helpers/media.helper';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private configService: ConfigService,
    private jwtService: JwtService,
    private redisRepository: RedisRepository,
    private mailService: MailService,
  ) {}

  private getRefreshTokenCacheKey(userId: number, token: string) {
    return `user:refresh_token:${userId}:${token}`;
  }

  public async SendEmailVerificationCode(email: string) {
    const code = GetVerificationCode().toString();

    await this.redisRepository.Set(`user:otp:${email}`, code, 60 * 5);

    await this.mailService.SendMail(
      'otp',
      { otp_code: code },
      {
        to: email,
        subject: 'Email Verification Code',
      },
    );

    return {
      message: 'Email verification code sent successfully',
    };
  }

  public async Authenticate(
    body: AuthenticateDto,
  ): Promise<{ user: UserModel; access_token: string; refresh_token: string }> {
    if (body.id_token) {
      return this.authenticateWithFirebase(body.id_token, body.device_id);
    }

    if (body.email && body.otp_code) {
      return this.authenticateWithEmailOtp(
        body.email,
        body.otp_code,
        body.device_id,
      );
    }

    throw new BadRequestException('Invalid authentication payload');
  }

  private async authenticateWithFirebase(
    idToken: string,
    deviceId?: number,
  ): Promise<{ user: UserModel; access_token: string; refresh_token: string }> {
    let decodedToken: admin.auth.DecodedIdToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Invalid Firebase ID token');
    }

    if (decodedToken.email && !decodedToken.email_verified) {
      throw new UnauthorizedException('Email not verified');
    }

    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;
    const phone = decodedToken.phone_number;
    const picture = decodedToken.picture;

    let user = await this.userRepository.FindOne({
      firebase_uid: firebaseUid,
    });

    if (!user) {
      const newUser = new UserModel();
      newUser.firebase_uid = firebaseUid;
      newUser.email = email;
      newUser.name = this.buildDefaultName(email, decodedToken.name);
      newUser.phone = phone;
      newUser.image_url = picture;

      user = await this.userRepository.Create(newUser);
    } else {
      const updates: Partial<UserModel> = {};

      if (email && user.email !== email) {
        updates.email = email;
        user.email = email;
      }

      if (phone && user.phone !== phone) {
        updates.phone = phone;
        user.phone = phone;
      }

      if (picture && user.image_url !== picture) {
        updates.image_url = picture;
        user.image_url = picture;
      }

      if (!user.name && decodedToken.name) {
        updates.name = decodedToken.name;
        user.name = decodedToken.name;
      }

      if (Object.keys(updates).length) {
        await this.userRepository.Update({ id: user.id }, updates);
      }
    }

    return this.finalizeAuthentication(user, deviceId);
  }

  private async authenticateWithEmailOtp(
    email: string,
    otpCode: string,
    deviceId?: number,
  ): Promise<{ user: UserModel; access_token: string; refresh_token: string }> {
    const redisKey = `user:otp:${email}`;
    const cachedCode = await this.redisRepository.Get(redisKey);

    if (!cachedCode) {
      throw new BadRequestException('Verification code expired');
    }

    if (cachedCode !== otpCode) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.redisRepository.Delete(redisKey);

    let user = await this.userRepository.FindOne({
      email: email,
    });

    if (!user) {
      let firebaseUser: admin.auth.UserRecord;
      try {
        try {
          firebaseUser = await admin.auth().getUserByEmail(email);
          if (!firebaseUser.emailVerified) {
            firebaseUser = await admin.auth().updateUser(firebaseUser.uid, {
              emailVerified: true,
            });
          }
        } catch (getUserError) {
          if (getUserError.code === 'auth/user-not-found') {
            firebaseUser = await admin.auth().createUser({
              email: email,
              emailVerified: true,
              displayName: this.buildDefaultName(email),
            });
          } else {
            throw getUserError;
          }
        }
      } catch (error) {
        console.error('Failed to get/create Firebase user:', error);
        throw new BadRequestException('Failed to create user account');
      }

      const newUser = new UserModel();
      newUser.firebase_uid = firebaseUser.uid;
      newUser.email = email;
      newUser.name = this.buildDefaultName(email);

      user = await this.userRepository.Create(newUser);
    }

    return this.finalizeAuthentication(user, deviceId);
  }

  private async finalizeAuthentication(
    user: UserModel,
    deviceId?: number,
  ): Promise<{ user: UserModel; access_token: string; refresh_token: string }> {
    const payload: IRedisUser = {
      id: user.id,
      name: user.name,
      firebase_uid: user.firebase_uid,
      device_id: deviceId,
    };

    // Access Token: Short-lived
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('ACCESS_TOKEN_SECRET'),
      expiresIn: '30m',
    });

    // Refresh Token: Long-lived
    const refreshTokenTimeoutHours = this.configService.get<number>(
      'USER_SESSION_TIMEOUT',
      168,
    );
    const refreshToken = this.jwtService.sign(
      { id: user.id },
      {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
        expiresIn: `${refreshTokenTimeoutHours}h`,
      },
    );

    // Store Refresh Token in Redis
    await this.redisRepository.Set(
      this.getRefreshTokenCacheKey(user.id, refreshToken),
      JSON.stringify(payload),
      refreshTokenTimeoutHours * 3600,
    );

    return {
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  public async RefreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string }> {
    let payload: { id: number };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const cachedSession = await this.redisRepository.Get(
      this.getRefreshTokenCacheKey(payload.id, refreshToken),
    );
    if (!cachedSession) {
      throw new UnauthorizedException('Session expired or logged out');
    }

    const userPayload: IRedisUser = JSON.parse(cachedSession);

    // Generate new short-lived access token
    const accessToken = this.jwtService.sign(userPayload, {
      secret: this.configService.get('ACCESS_TOKEN_SECRET'),
      expiresIn: '30m',
    });

    return { access_token: accessToken };
  }

  public async GetUserFromToken(token: string): Promise<IRedisUser> {
    try {
      return this.jwtService.verify<IRedisUser>(token, {
        secret: this.configService.get('ACCESS_TOKEN_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  public async Logout(refreshToken: string, user: IRedisUser) {
    await this.redisRepository.Delete(
      this.getRefreshTokenCacheKey(user.id, refreshToken),
    );
    return { success: true };
  }

  public async GetMe(user: IRedisUser) {
    const userData = await this.userRepository.FindById(user.id);
    return userData;
  }

  public async UpdateMe(body: UpdateMeDto, user: IRedisUser) {
    const userData = await this.userRepository.FindOne({ id: user.id });

    if (!userData) {
      throw new BadRequestException('User not found');
    }

    const updates: Partial<UserModel> = {
      name: body.name,
      phone: body.phone,
      geo_location: body.geo_location as any,
    };

    await this.userRepository.Update({ id: user.id }, updates);

    return await this.GetMe(user);
  }

  public async DeleteMe(user: IRedisUser) {
    await this.userRepository.Update(
      { id: user.id },
      {
        is_deleted: true,
        deleted_at: Date.now(),
      },
    );

    return true;
  }

  public async UploadProfileImage(user: IRedisUser, file) {
    const userData = await this.userRepository.FindOne({ id: user.id });

    if (userData.image_url) {
      const fileKey = userData.image_url.split('?')[0];
      await DeleteAWSFile(fileKey.substring(fileKey.lastIndexOf('/') + 1));
    }

    await this.userRepository.Update(
      { id: user.id },
      { image_url: file.location },
    );

    const imageUrl = await GetAWSSignedUrl(file.location);
    return {
      image_url: imageUrl,
    };
  }

  private buildDefaultName(email?: string, preferredName?: string) {
    if (preferredName && preferredName.trim().length > 0) {
      return preferredName.trim();
    }

    if (email) {
      const [localPart] = email.split('@');
      if (localPart && localPart.trim().length > 0) {
        return localPart.trim();
      }
    }

    return 'User';
  }
}
