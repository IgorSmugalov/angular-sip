import { inject, Injectable, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { SIP_AGENT_CONFIG } from '@app/configs/tokens';
import {
  TSipAgentConnectionState,
  TSipAgentRegistrationState,
  TSipState,
} from '@models/sip-agent/types';
import {
  SIP_AGENT_CONNECTION_STATE_CONNECTED,
  SIP_AGENT_REGISTRATION_STATE_REGISTERED,
  SIP_STATE_CHANGING,
  SIP_STATE_ERROR,
  SIP_STATE_OFFLINE,
  SIP_STATE_ONLINE,
} from './constants';
import { BehaviorSubject, combineLatest, of, take, timeout } from 'rxjs';
import { filter, map, pairwise, startWith, switchMap, tap } from 'rxjs/operators';
import { SIP_CREDENTIALS } from './tokens';
import { SipAgent } from './agent';

@Injectable({
  providedIn: 'root',
})
export class SipAgentService implements OnDestroy {
  private _sipAccount = inject(SIP_CREDENTIALS);
  private _sipAgentSettings = inject(SIP_AGENT_CONFIG);

  public state = new FormControl<TSipState>(SIP_STATE_OFFLINE);
  public stateChanging$ = new BehaviorSubject<boolean>(false);

  public agent$ = new BehaviorSubject<SipAgent | null>(null);

  constructor() {
    this.agent$.pipe().subscribe((value) => {
      console.log(value?.id);
    });
    // При создании новых UserAgent отменяет регистрацию и отключается от старых
    this.agent$
      .pipe(
        tap(() => this.state.setValue(SIP_STATE_OFFLINE)),
        pairwise(),
        filter(([existingAgent]) => !!existingAgent),
        map(([existingAgent]) => existingAgent),
        tap((existingAgent) => existingAgent!.destroy()),
      )
      .subscribe();

    // При получении новых параметров генерирует новые UserAgent'ы
    combineLatest([this._sipAgentSettings, this._sipAccount])
      .pipe(
        filter(([, accounts]) => !!accounts),
        map(([settings, account]) => {
          return new SipAgent(account!, settings);
        }),
        tap((agent) => {
          this.agent$.next(agent);
        }),
      )
      .subscribe();

    this.state.valueChanges
      .pipe(
        startWith(this.state.value),
        filter(() => !!this.agent$.value),
        tap(() => {
          this.stateChanging$.next(true);
        }),
        tap((value) => {
          this.setAgentState(value!);
          this.state.setValue(SIP_STATE_CHANGING, { emitEvent: false });
        }),
        switchMap((targetState) => {
          const agent = this.agent$.value;
          return combineLatest([agent!.connectionState$, agent!.registrationState$]).pipe(
            map((states) => mapState(...states)),
            filter((state) => state === targetState),
            timeout({ first: 15_000, with: () => of(SIP_STATE_ERROR) }),
            take(1),
          );
        }),
        tap(() => {
          this.stateChanging$.next(false);
        }),
        tap((state) => {
          this.state.setValue(state, { emitEvent: false });
        }),
      )
      .subscribe();
  }

  public setAgentState(newState: Omit<TSipState, 'changing'>) {
    const userAgent = this.agent$.value;

    if (!userAgent) {
      return;
    }

    switch (newState) {
      case SIP_STATE_OFFLINE: {
        this.stop();
        break;
      }

      case SIP_STATE_ONLINE: {
        this.start();
        break;
      }
    }
  }

  public start() {
    const agent = this.agent$.value;
    if (!agent) {
      return;
    }
    agent.start();
  }

  public stop() {
    const agent = this.agent$.value;
    if (!agent) {
      return;
    }
    agent.stop();
  }

  // public registerAll() {
  //   const agents = this.agent$.value;
  //   for (const agent of agents) {
  //     agent.register();
  //   }
  // }
  //
  // public unregisterAll() {
  //   const agents = this.agent$.value;
  //   for (const agent of agents) {
  //     agent.unregister();
  //   }
  // }

  public init() {
    // Noop.
  }

  public ngOnDestroy(): void {
    this.agent$.next(null);
  }
}

function mapState(
  connectionsState: TSipAgentConnectionState,
  registrationState: TSipAgentRegistrationState,
) {
  if (
    connectionsState === SIP_AGENT_CONNECTION_STATE_CONNECTED &&
    registrationState === SIP_AGENT_REGISTRATION_STATE_REGISTERED
  ) {
    return SIP_STATE_ONLINE;
  }

  return SIP_STATE_OFFLINE;
}
