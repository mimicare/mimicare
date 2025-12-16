import { Controller, Get } from '@nestjs/common';
import { type HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type PrismaHealthIndicator } from './prisma.health';
import { type InternetHealthIndicator } from './internet.health';
import { Public } from '../../../common/decorators/common';

@Controller({ version: '1', path: 'server/health' })
@ApiTags('Health')
export class V1HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealthIndicator: PrismaHealthIndicator,
    private internetHealthIndicator: InternetHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Perform health checks for the application' })
  @ApiResponse({
    status: 200,
    description: 'Health check successful',
    schema: {
      example: {
        statusCode: 200,
        message: 'Health check successful',
        data: {
          details: {
            internet: { status: 'up' },
            database: { status: 'up' },
          },
          error: {},
          info: {
            internet: { status: 'up' },
            database: { status: 'up' },
          },
        },
        errors: [],
        timestamp: '2024-09-08T17:38:42.611Z',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Health check failed',
    schema: {
      example: {
        statusCode: 500,
        message: 'Health check failed',
        data: null,
        errors: ['Health check failure message'],
        timestamp: '2024-09-08T17:38:42.611Z',
      },
    },
  })
  async check() {
    const healthChecks = [
      () => this.internetHealthIndicator.isHealthy('internet'),
      () => this.prismaHealthIndicator.isHealthy('database'),
    ];

    try {
      const result = await this.health.check(healthChecks);

      return {
        statusCode: 200,
        message: 'Health check successful',
        data: result,
        errors: [],
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        statusCode: error?.response?.status || 500,
        message: 'Health check failed',
        data: error?.response || null,
        errors: [error?.message || 'Unknown error'],
        timestamp: new Date().toISOString(),
      };
    }
  }
}
