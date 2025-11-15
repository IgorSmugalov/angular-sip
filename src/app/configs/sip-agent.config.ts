import { UAConfiguration } from 'jssip/lib/UA';

export const SIP_AGENT_DEFAULT_CONFIG: Partial<UAConfiguration> = {
  session_timers_refresh_method: 'invite',
  register_expires: 60,
  connection_recovery_min_interval: 15,
  connection_recovery_max_interval: 15,
};
