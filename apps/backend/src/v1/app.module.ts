// v1/app.module.ts
import { Module } from '@nestjs/common';
import { V1AuthModule } from './auth/auth.module';
import { V1ServerModule } from './server/server.module';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from '../common/guards/auth';
import { V1ProfileModule } from './profile/profile.module';
import { V1ReproductiveModule } from './reproductive/reproductive.module';
@Module({
  imports: [
    // ALL your V1 modules
    V1AuthModule,
    // V1UserModule,
    V1ServerModule,
    V1ProfileModule,
    V1ReproductiveModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
  ],
  exports: [
    // export if needed by the root or other modules
    V1ServerModule,
    V1AuthModule,
    V1ProfileModule,
    V1ReproductiveModule,
  ],
})
export class V1AppModule {}
