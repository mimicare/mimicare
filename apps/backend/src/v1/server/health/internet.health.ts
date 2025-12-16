import { Injectable } from '@nestjs/common';
import { HealthIndicator, type HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { type HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class InternetHealthIndicator extends HealthIndicator {
  constructor(private readonly httpService: HttpService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    // Skip internet check behind corporate proxy
    // CNTLM rejects GET requests to HTTPS URLs (expects CONNECT tunnel)
    if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
      return this.getStatus(key, true, {
        message: 'Skipped behind corporate proxy',
        proxy: process.env.HTTP_PROXY || process.env.HTTPS_PROXY,
      });
    }

    // Normal internet check for production
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://www.google.com', {
          timeout: 5000,
          validateStatus: (status) => status === 200,
        }),
      );

      return this.getStatus(key, true, {
        statusCode: response.status,
        statusText: response.statusText,
      });
    } catch (error: any) {
      const status = this.getStatus(key, false, {
        message: error.message,
        statusCode: error.response?.status,
        statusText: error.response?.statusText,
      });
      throw new HealthCheckError('Internet check failed', status);
    }
  }
}
