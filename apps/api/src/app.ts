import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { healthRoutes } from './routes/health.js';
import { hookController } from './modules/hooks/hook.controller.js';
import { createHookService, type HookService } from './modules/hooks/hook.service.js';

export interface AppDeps {
  hookService?: HookService;
}

export async function buildApp(deps: AppDeps = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  await app.register(cors, {
    origin: true,
  });

  await app.register(healthRoutes);

  const hookService = deps.hookService ?? createHookService();
  await app.register(async (instance) => hookController(instance, { service: hookService }));

  return app;
}
