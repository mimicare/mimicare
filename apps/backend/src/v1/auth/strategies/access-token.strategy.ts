import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { type ConfigService } from '@nestjs/config';
import { type PrismaService } from '../../../prisma/prisma.service';
import { type StatefulJwtPayload } from '../types'; // or '../auth.service', wherever you export it from

/**
 * JWT Access Token Strategy
 * Validates access tokens for protected routes
 * Token lifetime: 15 minutes
 * NOW STATEFUL: validates sessionId against RefreshToken table
 */
@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_SECRET') || '',
    });
  }

  async validate(payload: StatefulJwtPayload) {
    // 1. Check that user exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // 2. CRITICAL: Check that the session (RefreshToken row) is valid
    // payload.sessionId MUST be the ID of the refreshToken record (as you already embed in generateTokens)
    const session = await this.prisma.refreshToken.findUnique({
      where: { id: payload.sessionId },
      select: { isRevoked: true, expiresAt: true },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.isRevoked) {
      throw new UnauthorizedException('Session revoked. Please log in again.');
    }

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException('Session expired');
    }

    // 3. Return what you want attached to req.user
    return { userId: user.id, email: user.email, role: user.role };
  }
}
