import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { V1HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma.health';
import { InternetHealthIndicator } from './internet.health';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [TerminusModule, HttpModule, PrismaModule],
  controllers: [V1HealthController],
  providers: [PrismaHealthIndicator, InternetHealthIndicator],
})
export class V1HealthModule {}
