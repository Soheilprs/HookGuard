import type { AnalysisRule } from '../analysis/types.js';
import { callbackCallBeforeStorageDetector } from './detectors/dangerous-operation.js';
import { callbackReachableDelegatecallDetector } from './detectors/delegatecall-path.js';
import { callbackExternalCallDetector } from './detectors/external-call-path.js';
import { callbackStorageMutationDetector } from './detectors/storage-mutation.js';

export const BYTECODE_CFG_RULE_IDS = [
  'CALLBACK_REACHABLE_DELEGATECALL',
  'CALLBACK_EXTERNAL_CALL',
  'CALLBACK_STORAGE_MUTATION',
  'CALLBACK_EXTERNAL_CALL_BEFORE_STORAGE_UPDATE',
] as const;

export const bytecodeAnalysisRules: AnalysisRule[] = [
  callbackReachableDelegatecallDetector,
  callbackExternalCallDetector,
  callbackStorageMutationDetector,
  callbackCallBeforeStorageDetector,
];

export {
  analyzeHookBytecode,
  BYTECODE_CFG,
  clearBytecodeAnalysisCache,
} from './program.js';
