import {
  TSipAgentConnectionStateConnected,
  TSipAgentConnectionStateConnecting,
  TSipAgentConnectionStateDisconnected,
  TSipAgentRegistrationStateFailed,
  TSipAgentRegistrationStateRegistered,
  TSipAgentRegistrationStateUnregistered,
  TSipStateChanging,
  TSipStateError,
  TSipStateOffline,
  TSipStateOnline,
} from './types';

export const SIP_AGENT_CONNECTION_STATE_CONNECTING: TSipAgentConnectionStateConnecting =
  'connecting';
export const SIP_AGENT_CONNECTION_STATE_CONNECTED: TSipAgentConnectionStateConnected = 'connected';
export const SIP_AGENT_CONNECTION_STATE_DISCONNECTED: TSipAgentConnectionStateDisconnected =
  'disconnected';

export const SIP_AGENT_REGISTRATION_STATE_REGISTERED: TSipAgentRegistrationStateRegistered =
  'registered';
export const SIP_AGENT_REGISTRATION_STATE_UNREGISTERED: TSipAgentRegistrationStateUnregistered =
  'unregistered';
export const SIP_AGENT_REGISTRATION_STATE_FAILED: TSipAgentRegistrationStateFailed = 'failed';

export const SIP_STATE_OFFLINE: TSipStateOffline = 'offline';
export const SIP_STATE_ONLINE: TSipStateOnline = 'online';
export const SIP_STATE_CHANGING: TSipStateChanging = 'changing';
export const SIP_STATE_ERROR: TSipStateError = 'error';
