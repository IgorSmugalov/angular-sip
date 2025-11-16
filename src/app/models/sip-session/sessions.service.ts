import { inject, Injectable } from '@angular/core';
import { SIP_SESSION_CONFIG } from '@app/configs/tokens';
import { SipAgentService } from '@models/sip-agent';
import { SipSession } from '@models/sip-session/session';
import { BehaviorSubject, merge, ReplaySubject } from 'rxjs';
import { filter, pairwise, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
  deps: [SipAgentService],
})
export class SipSessionsService {
  private _sipAgentService = inject(SipAgentService);
  private _sipSessionConfig = inject(SIP_SESSION_CONFIG);

  public sessions$ = new BehaviorSubject(new Map<string, SipSession>());
  public selectedSession$ = new BehaviorSubject<SipSession | null>(null);
  public newestSession$ = new ReplaySubject<SipSession>();

  constructor() {
    // Удаляет из sessions$ завершенные сессии
    this.sessions$
      .pipe(
        switchMap((sessions) => {
          const _sessions = [...sessions.values()];
          const sessionsEndEvents$ = _sessions.map((session) => session.destroy$);

          return merge(...sessionsEndEvents$);
        }),
        tap((sessionIdentity) => {
          this._removeSession({ id: sessionIdentity });
        }),
      )
      .subscribe();

    // Обработка переключения на звонок
    this.selectedSession$
      .pipe(
        pairwise(),
        tap(([prev, curr]) => {
          // Приостанавливаем предыдущий звонок
          if (prev && !prev.isOnHold$.value) {
            prev.hold();
          }

          // Активируем текущий звонок
          if (curr) {
            // if (prev && curr.rtcSession.direction === 'incoming' && !curr.isConfirmed$.value) {
            //   // Если это было переключение с другого звонка - сразу отвечаем
            //   curr.answer(this._sipSessionConfig.answerConfig);
            // }

            // Снимаем с удержания если нужно
            if (curr.isOnHold$.value) {
              curr.unHold();
            }
          }
        }),
      )
      .subscribe();

    // Обработка новых входящих сессий
    this._sipAgentService.agent$
      .pipe(
        tap(() => this._clearSessions()),
        filter(Boolean),
        switchMap((agent) => agent.newSession$),
        tap((event) => {
          const callId = event.request.getHeaders('Call-ID')[0];
          const { session } = event;
          const sipSession = new SipSession(callId, session);

          const existingSession = this._getSessionByRemoteIdentity(sipSession.remoteIdentity);
          if (existingSession) {
            sipSession.finish(); // Завершаем дубликат
            return;
          }

          this._addSession(sipSession);

          // Автовыбор если нет активной сессий
          if (!this.selectedSession$.value) {
            this.selectedSession$.next(sipSession);
          }
        }),
      )
      .subscribe();
  }

  private _addSession(session: SipSession) {
    const sessions = this.sessions$.value;
    sessions.set(session.id, session);
    this.newestSession$.next(session);
    this.sessions$.next(sessions);
  }

  private _removeSession(session: Pick<SipSession, 'id'>) {
    if (!session.id) {
      return;
    }
    const sessions = this.sessions$.value;
    sessions.delete(session.id);
    this.sessions$.next(sessions);
    if (this.selectedSession$.value?.id === session.id) {
      this.selectedSession$.next(null);
    }
  }

  private _getSessionByRemoteIdentity(remoteIdentity: string) {
    const sessions = this.sessions$.value;

    return [...sessions.values()].find((session) => session.remoteIdentity === remoteIdentity);
  }

  private _clearSessions() {
    const sessions = this.sessions$.value;
    sessions.clear();
    this.sessions$.next(sessions);
  }

  public call(addressee: string) {
    const agent = this._sipAgentService.agent$.value;
    if (!agent) {
      return;
    }
    agent.call(addressee, this._sipSessionConfig.outgoingConfig);
  }

  public answer(sessionId: string) {
    const session = this.switchToSession(sessionId);

    session?.answer(this._sipSessionConfig.answerConfig);
  }

  public switchToSession(sessionId: string | null) {
    const sessions = this.sessions$.value;
    const session = sessionId ? (sessions.get(sessionId) ?? null) : null;
    this.selectedSession$.next(session);

    return session;
  }

  private _getSessionById(sessionId: string): SipSession | null {
    const sessions = this.sessions$.value;

    return sessions.get(sessionId) ?? null;
  }

  public init() {
    //  Noop.
  }

  public destroy() {
    // Noop.
  }
}
