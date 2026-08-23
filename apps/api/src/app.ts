import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { healthRoutes } from './routes/health.js';
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

export interface AppDeps {
  hookService?: HookService;
  contractService?: ContractService;
  findingService?: FindingService;
}

export async function buildApp(deps: AppDeps = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  await app.register(cors, {
    origin: true,
  });

  await app.register(healthRoutes);
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

  return app;
}
