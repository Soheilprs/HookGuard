import 'dotenv/config';
import { buildApp } from './app.js';
import { getApiConfig } from './config.js';

const config = getApiConfig();
const app = await buildApp();

try {
  await app.listen({ host: config.host, port: config.port });
  app.log.info(`HookGuard API listening on ${config.host}:${config.port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
