import type { AnalysisRule } from '../analysis/types.js';
import { protocolInteractionDetector } from './detectors/protocol-interaction.js';
import { tokenTransferInCallbackDetector } from './detectors/token-transfer-in-callback.js';
import { unknownExternalTargetDetector } from './detectors/unknown-external-target.js';
import { userControlledCallDetector } from './detectors/user-controlled-call.js';

export const INTERACTION_RULE_IDS = [
  'UNKNOWN_EXTERNAL_TARGET',
  'TOKEN_MOVEMENT_IN_CALLBACK',
  'USER_CONTROLLED_EXTERNAL_EXECUTION',
  'PROTOCOL_INTERACTION',
] as const;

export const interactionAnalysisRules: AnalysisRule[] = [
  unknownExternalTargetDetector,
  tokenTransferInCallbackDetector,
  userControlledCallDetector,
  protocolInteractionDetector,
];

export { recoverCallbackInteractions } from './analysis/external-calls.js';
