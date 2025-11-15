import { InjectionToken } from '@angular/core';
import { ISipAgentCredentials } from '@models/sip-agent/types';
import { BehaviorSubject } from 'rxjs';

export function SIP_CREDENTIALS_FACTORY(): BehaviorSubject<ISipAgentCredentials | null> {
  return new BehaviorSubject<ISipAgentCredentials | null>(null);
}

export const SIP_CREDENTIALS = new InjectionToken<BehaviorSubject<ISipAgentCredentials | null>>(
  'sip-credentials',
  {
    providedIn: 'root',
    factory: SIP_CREDENTIALS_FACTORY,
  },
);
