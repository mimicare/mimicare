import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { V1AuthController } from './auth.controller';
import { V1AuthService } from './auth.service';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [V1AuthController],
  providers: [V1AuthService, AccessTokenStrategy, RefreshTokenStrategy, GoogleStrategy],
  exports: [V1AuthService],
})
export class V1AuthModule {}
