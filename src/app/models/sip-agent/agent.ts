import {
  SIP_AGENT_REGISTRATION_STATE_REGISTERED,
  SIP_AGENT_REGISTRATION_STATE_UNREGISTERED,
  SIP_AGENT_CONNECTION_STATE_CONNECTED,
  SIP_AGENT_CONNECTION_STATE_DISCONNECTED,
  SIP_AGENT_REGISTRATION_STATE_FAILED,
} from './constants';
import {
  ISipAgentCredentials,
  TSipAgentConnectionState,
  TSipAgentRegistrationState,
} from './types';
import { CallOptions, RTCSessionEvent, UAConfiguration } from 'jssip/lib/UA';
import { nanoid } from 'nanoid';
import { BehaviorSubject, fromEvent, map, merge, Observable, Subject, takeUntil, tap } from 'rxjs';
import JsSIP, { UA } from 'jssip';

export class SipAgent {
  private readonly _destroy$ = new Subject<void>();
  public readonly id = nanoid();
  public userAgent: UA | null = null;

  public readonly connectionState$ = new BehaviorSubject<TSipAgentConnectionState>(
    SIP_AGENT_CONNECTION_STATE_DISCONNECTED,
  );
  public readonly registrationState$ = new BehaviorSubject<TSipAgentRegistrationState>(
    SIP_AGENT_REGISTRATION_STATE_UNREGISTERED,
  );
  public readonly user: string;

  public newSession$ = new Subject<RTCSessionEvent>();

  constructor(credentials: ISipAgentCredentials, settings: Partial<UAConfiguration>) {
    try {
      const { url, sip_number, sip_password } = credentials;

      const sockets = new JsSIP.WebSocketInterface(url);
      const uaConfig: UAConfiguration = {
        ...settings,
        sockets,
        uri: sip_number,
        password: sip_password,
      };

      this.user = sip_number;
      this.userAgent = new UA(uaConfig);

      this.setupEventListeners();
    } catch (error) {
      this.destroy();
      throw new Error(`Ошибка создания UserAgent`);
    }
  }

  private setupEventListeners(): void {
    if (!this.userAgent) return;

    // New session events
    const newSession$ = fromEvent(this.userAgent, 'newRTCSession') as Observable<RTCSessionEvent>;
    newSession$.pipe(takeUntil(this._destroy$)).subscribe((session) => {
      this.newSession$.next(session);
    });

    // Connection state events
    const connectionState$ = merge(
      fromEvent(this.userAgent, 'connected').pipe(map(() => SIP_AGENT_CONNECTION_STATE_CONNECTED)),
      fromEvent(this.userAgent, 'disconnected').pipe(
        map(() => SIP_AGENT_CONNECTION_STATE_DISCONNECTED),
      ),
    );

    connectionState$
      .pipe(
        takeUntil(this._destroy$),
        tap((state) => this.connectionState$.next(state)),
      )
      .subscribe();

    // Registration state events
    const registrationState$ = merge(
      fromEvent(this.userAgent, 'unregistered').pipe(
        map(() => SIP_AGENT_REGISTRATION_STATE_UNREGISTERED),
      ),
      fromEvent(this.userAgent, 'registered').pipe(
        map(() => SIP_AGENT_REGISTRATION_STATE_REGISTERED),
      ),
      fromEvent(this.userAgent, 'registrationFailed').pipe(
        map(() => SIP_AGENT_REGISTRATION_STATE_FAILED),
      ),
    );

    registrationState$
      .pipe(
        takeUntil(this._destroy$),
        tap((state) => this.registrationState$.next(state)),
      )
      .subscribe();
  }

  public destroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    this.newSession$.complete();

    if (this.userAgent) {
      this.userAgent.stop();
      this.userAgent = null;
    }
  }

  get isReady(): boolean {
    return this.userAgent ? this.userAgent.isRegistered() && this.userAgent.isConnected() : false;
  }

  public call(target: string, options?: CallOptions): void {
    if (!this.userAgent) {
      throw new Error('UserAgent не создан');
    }
    this.userAgent.call(target, options);
  }
}
