import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { loadApiConfigFromEnv } from '@hookguard/config';
import { healthRoutes, type DatabasePing } from './routes/health.js';
import { hookController } from './modules/hooks/hook.controller.js';
import { createHookService, type HookService } from './modules/hooks/hook.service.js';
import { contractController } from './modules/contracts/contract.controller.js';
import {
  createContractService,
  type ContractService,
} from './modules/contracts/contract.service.js';
import { statsController } from './modules/stats/stats.controller.js';
import { findingController } from './modules/findings/finding.controller.js';
import {
  createFindingService,
  type FindingService,
} from './modules/findings/finding.service.js';
import { monitoringController } from './modules/monitoring/controller.js';
import {
  createMonitoringService,
  type MonitoringService,
} from './modules/monitoring/service.js';
import { alertController } from './modules/alerts/controller.js';
import { createAlertService, type AlertService } from './modules/alerts/alert.service.js';
import { publicController } from './modules/public/controller.js';
import {
  createPublicHookService,
  type PublicHookService,
} from './modules/public/public.service.js';
import { watchlistController } from './modules/watchlist/controller.js';
import {
  createWatchlistService,
  type WatchlistService,
} from './modules/watchlist/service.js';

export interface AppDeps {
  hookService?: HookService;
  contractService?: ContractService;
  findingService?: FindingService;
  monitoringService?: MonitoringService;
  watchlistService?: WatchlistService;
  alertService?: AlertService;
  publicHookService?: PublicHookService;
  databasePing?: DatabasePing;
}

export async function buildApp(deps: AppDeps = {}): Promise<FastifyInstance> {
  const config = loadApiConfigFromEnv();
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  const corsOrigin =
    config.corsOrigin === true
      ? true
      : config.corsOrigin.length === 0
        ? false
        : config.corsOrigin;

  await app.register(cors, {
    origin: corsOrigin,
  });

  app.setErrorHandler((error, request, reply) => {
    const status =
      error && typeof error === 'object' && 'statusCode' in error
        ? Number(error.statusCode) || 500
        : 500;
    request.log.error(error);
    const hide = config.env === 'production' && status >= 500;
    return reply.status(status).send({
      error: hide
        ? 'Internal error'
        : error instanceof Error
          ? error.message
          : 'Request failed',
    });
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({ error: 'Not found' });
  });

  await healthRoutes(app, { ping: deps.databasePing });
  await app.register(statsController);

  const hookService = deps.hookService ?? createHookService();
  await app.register(async (instance) => hookController(instance, { service: hookService }));

  const contractService = deps.contractService ?? createContractService();
  await app.register(async (instance) =>
    contractController(instance, { service: contractService }),
  );

  const findingService = deps.findingService ?? createFindingService();
  await app.register(async (instance) =>
    findingController(instance, { service: findingService }),
  );

  const monitoringService = deps.monitoringService ?? createMonitoringService();
  await app.register(async (instance) =>
    monitoringController(instance, { service: monitoringService }),
  );

  const watchlistService = deps.watchlistService ?? createWatchlistService();
  await app.register(async (instance) =>
    watchlistController(instance, { service: watchlistService }),
  );

  const alertService = deps.alertService ?? createAlertService();
  await app.register(async (instance) =>
    alertController(instance, { service: alertService }),
  );

  const publicHookService = deps.publicHookService ?? createPublicHookService();
  await app.register(async (instance) =>
    publicController(instance, { service: publicHookService }),
  );

  return app;
}
