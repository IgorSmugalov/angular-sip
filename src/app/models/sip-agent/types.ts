export interface ISipAgentCredentials {
  url: string;
  sip_number: string;
  sip_password: string;
}

export type TSipAgentConnectionStateConnecting = 'connecting';
export type TSipAgentConnectionStateConnected = 'connected';
export type TSipAgentConnectionStateDisconnected = 'disconnected';
export type TSipAgentConnectionState =
  | TSipAgentConnectionStateConnecting
  | TSipAgentConnectionStateConnected
  | TSipAgentConnectionStateDisconnected;

export type TSipAgentRegistrationStateRegistered = 'registered';
export type TSipAgentRegistrationStateUnregistered = 'unregistered';
export type TSipAgentRegistrationStateFailed = 'failed';
export type TSipAgentRegistrationState =
  | TSipAgentRegistrationStateRegistered
  | TSipAgentRegistrationStateUnregistered
  | TSipAgentRegistrationStateFailed;

export type TSipStateOffline = 'offline';
export type TSipStateOnline = 'online';
export type TSipStateChanging = 'changing';
export type TSipStateError = 'error';
export type TSipState = TSipStateOffline | TSipStateOnline | TSipStateChanging | TSipStateError;
