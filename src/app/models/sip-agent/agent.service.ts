import { inject, Injectable, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
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
import { BehaviorSubject, combineLatest, EMPTY, of } from 'rxjs';
import {
  catchError,
  filter,
  map,
  pairwise,
  startWith,
  switchMap,
  take,
  tap,
  timeout,
} from 'rxjs/operators';
import { SIP_CREDENTIALS } from './tokens';
import { SipAgent } from './agent';

@Injectable({
  providedIn: 'root',
})
export class SipAgentService implements OnDestroy {
  private _sipAccount = inject(SIP_CREDENTIALS);
  private _sipAgentSettings = inject(SIP_AGENT_CONFIG);
  private _snackBar = inject(MatSnackBar);

  public state = new FormControl<TSipState>(SIP_STATE_OFFLINE);
  public stateChanging$ = new BehaviorSubject<boolean>(false);

  public agent$ = new BehaviorSubject<SipAgent | null>(null);

  constructor() {
    // При создании новых UserAgent отменяет регистрацию и отключается от старых
    this.agent$
      .pipe(
        pairwise(),
        filter(([prevAgent]) => !!prevAgent),
        tap(([prevAgent]) => {
          this.state.setValue(SIP_STATE_OFFLINE);
          prevAgent!.destroy();
        }),
      )
      .subscribe();

    // При получении новых параметров генерирует новые UserAgent'ы
    combineLatest([this._sipAgentSettings, this._sipAccount])
      .pipe(
        filter(([, accounts]) => !!accounts),
        map(([settings, account]) => {
          try {
            return new SipAgent(account!, settings);
          } catch (error) {
            this._snackBar.open(
              'Ошибка при создании агента, проверьте корректность указанных данных',
              'Ok',
              { duration: 3000, horizontalPosition: 'center', verticalPosition: 'top' },
            );
            return null;
          }
        }),
        filter((agent) => agent !== null),
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
            timeout({
              first: 15_000,
              with: () => {
                this._snackBar.open('Таймаут изменения состояния', 'Ok', { duration: 3000 });
                return of(SIP_STATE_ERROR);
              },
            }),
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
    agent.userAgent!.start();
  }

  public stop() {
    const agent = this.agent$.value;
    if (!agent) {
      return;
    }
    agent.userAgent!.stop();
  }

  public init() {
    // Noop.
  }

  public ngOnDestroy(): void {
    this.agent$.value?.destroy();
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
