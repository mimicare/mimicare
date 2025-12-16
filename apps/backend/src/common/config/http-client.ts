import { Logger } from '@nestjs/common';
import axios, { type AxiosInstance } from 'axios';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

export function createHttpClient(): AxiosInstance {
  const logger = new Logger('HttpClient');
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;

  const client = axios.create({
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Mimicare/1.0)',
    },
  });

  const proxyUrl = httpProxy || httpsProxy;

  if (proxyUrl) {
    logger.log(`🔌 Proxy configured: ${proxyUrl}`);

    try {
      client.defaults.httpAgent = new HttpProxyAgent(proxyUrl);
      client.defaults.httpsAgent = new HttpsProxyAgent(proxyUrl);
      client.defaults.proxy = false;

      logger.log('✅ Proxy agents configured successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`❌ Failed to configure proxy: ${errorMessage}`);
    }
  } else {
    logger.log('🔌 No proxy configured (direct connection)');
  }

  return client;
}
