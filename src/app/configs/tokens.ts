import { InjectionToken } from '@angular/core';
import { ISipSessionConfig, SIP_SESSION_DEFAULT_CONFIG } from './sip-session.config';
import { SIP_AGENT_DEFAULT_CONFIG } from './sip-agent.config';
import { CallOptions, UAConfiguration } from 'jssip/lib/UA';
import { BehaviorSubject } from 'rxjs';

function SIP_AGENT_CONFIG_FACTORY(): BehaviorSubject<Partial<UAConfiguration>> {
  return new BehaviorSubject<Partial<UAConfiguration>>(SIP_AGENT_DEFAULT_CONFIG);
}

export const SIP_AGENT_CONFIG = new InjectionToken<BehaviorSubject<Partial<UAConfiguration>>>(
  'sip-agent-settings',
  { providedIn: 'root', factory: SIP_AGENT_CONFIG_FACTORY },
);

//

function SIP_SESSION_CONFIG_FACTORY(): ISipSessionConfig {
  return SIP_SESSION_DEFAULT_CONFIG;
}

export const SIP_SESSION_CONFIG = new InjectionToken<ISipSessionConfig>('sip-agent-settings', {
  providedIn: 'root',
  factory: SIP_SESSION_CONFIG_FACTORY,
});
