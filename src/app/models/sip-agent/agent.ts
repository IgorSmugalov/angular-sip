import {
  SIP_AGENT_REGISTRATION_STATE_REGISTERED,
  SIP_AGENT_REGISTRATION_STATE_UNREGISTERED,
  SIP_AGENT_CONNECTION_STATE_CONNECTED,
  SIP_AGENT_CONNECTION_STATE_DISCONNECTED,
  SIP_AGENT_REGISTRATION_STATE_FAILED,
} from '@models/sip-agent/constants';
import {
  ISipAgentCredentials,
  TSipAgentConnectionState,
  TSipAgentRegistrationState,
} from '@models/sip-agent/types';
import { RTCSessionEvent, UAConfiguration } from 'jssip/lib/UA';
import { nanoid } from 'nanoid';
import {
  BehaviorSubject,
  filter,
  fromEvent,
  map,
  merge,
  Observable,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
import JsSIP, { UA } from 'jssip';

export class SipAgent extends UA {
  private readonly _destroy$ = new Subject<void>();
  public readonly id = nanoid(7);

  public readonly connectionState$ = new BehaviorSubject<TSipAgentConnectionState>(
    SIP_AGENT_CONNECTION_STATE_DISCONNECTED,
  );
  public readonly registrationState$ = new BehaviorSubject<TSipAgentRegistrationState>(
    SIP_AGENT_REGISTRATION_STATE_UNREGISTERED,
  );
  public readonly user: string;

  public newSession$ = fromEvent(this, 'newRTCSession') as Observable<RTCSessionEvent>;

  constructor(credentials: ISipAgentCredentials, settings: Partial<UAConfiguration>) {
    const { url, sip_number, sip_password } = credentials;

    const sockets = new JsSIP.WebSocketInterface(url);

    const uaConfig: UAConfiguration = {
      ...settings,
      sockets,
      uri: sip_number,
      password: sip_password,
    };
    super(uaConfig);

    this.user = sip_number;

    const stateChange$ = merge(
      fromEvent(this, 'connected').pipe(map(() => SIP_AGENT_CONNECTION_STATE_CONNECTED)),
      fromEvent(this, 'disconnected').pipe(map(() => SIP_AGENT_CONNECTION_STATE_DISCONNECTED)),
    );

    stateChange$
      .pipe(
        takeUntil(this._destroy$),
        tap((state) => {
          this.connectionState$.next(state);
        }),
      )
      .subscribe();

    merge(
      fromEvent(this, 'unregistered').pipe(map(() => SIP_AGENT_REGISTRATION_STATE_UNREGISTERED)),
      fromEvent(this, 'registered').pipe(map(() => SIP_AGENT_REGISTRATION_STATE_REGISTERED)),
      fromEvent(this, 'registrationFailed').pipe(map(() => SIP_AGENT_REGISTRATION_STATE_FAILED)),
    )
      .pipe(
        takeUntil(this._destroy$),
        tap((state) => {
          this.registrationState$.next(state);
        }),
      )
      .subscribe();
  }

  public destroy() {
    super.stop();
    this._destroy$.next();
    this._destroy$.complete();
  }

  get isReady(): boolean {
    return this.isRegistered() && this.isConnected();
  }
}
