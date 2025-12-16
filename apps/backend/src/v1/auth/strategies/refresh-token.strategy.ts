import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, type StrategyOptionsWithRequest } from 'passport-jwt';
import { type ConfigService } from '@nestjs/config';
import { type JwtPayload } from '../types';
import { type Request } from 'express';

/**
 * JWT Refresh Token Strategy
 * Validates refresh tokens for token refresh endpoint
 * Token lifetime: 7 days
 */
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_TOKEN_SECRET') || '',
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  async validate(req: Request, payload: JwtPayload) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Malformed authorization header');
    }

    const deviceId = req.body.deviceId ?? req.query.deviceId ?? req.headers['x-device-id'];
    if (!deviceId) {
      throw new UnauthorizedException('Device ID is missing');
    }

    return {
      userId: payload.userId,
      role: payload.role,
      refreshToken: token,
      deviceId: deviceId as string,
    };
  }
}
