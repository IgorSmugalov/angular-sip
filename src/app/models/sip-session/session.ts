import { RTCPeerConnectionDeprecated, RTCSession } from 'jssip/lib/RTCSession';
import { CallOptions } from 'jssip/lib/UA';
import { nanoid } from 'nanoid';
import {
  BehaviorSubject,
  EMPTY,
  fromEvent,
  merge,
  Subject,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';
import { filter, tap } from 'rxjs/operators';

interface PeerConnectionEvent {
  peerconnection: RTCPeerConnectionDeprecated;
}

export class SipSession {
  public readonly rtcSession: RTCSession;
  public readonly id: string;
  public readonly remoteIdentity: string;
  public readonly direction: 'incoming' | 'outgoing';
  public readonly remoteTrack$ = new BehaviorSubject<MediaStream | null>(null);
  public readonly isConfirmed$ = new BehaviorSubject<boolean>(false);
  public readonly isOnHold$ = new BehaviorSubject<boolean>(false);
  public readonly isMuted$ = new BehaviorSubject<boolean>(false);
  public readonly isPristine$ = new BehaviorSubject<boolean>(true);

  private readonly _destroy$ = new Subject<string>();
  public readonly destroy$ = this._destroy$.asObservable();

  public connection$ = new BehaviorSubject<RTCPeerConnectionDeprecated | null>(null);

  constructor(id: string, session: RTCSession) {
    this.id = id;
    this.remoteIdentity = session.remote_identity?.uri?.user || 'unknown_' + nanoid(5);
    this.direction = session.direction;
    this.rtcSession = session;

    this._setupConnection();
    this._initListeners();
  }

  private _setupConnection(): void {
    if (this.rtcSession.connection) {
      this.connection$.next(this.rtcSession.connection);
    } else {
      const peerConnectionHandler = (event: PeerConnectionEvent) => {
        this.connection$.next(event.peerconnection);
      };

      this.rtcSession.on('peerconnection', peerConnectionHandler);

      this.destroy$.pipe(take(1)).subscribe(() => {
        this.rtcSession.off('peerconnection', peerConnectionHandler);
      });
    }
  }

  public _initListeners(): void {
    const confirmed$ = fromEvent(this.rtcSession, 'confirmed');
    const hold$ = fromEvent(this.rtcSession, 'hold');
    const unhold$ = fromEvent(this.rtcSession, 'unhold');
    const muted$ = fromEvent(this.rtcSession, 'muted');
    const unmuted$ = fromEvent(this.rtcSession, 'unmuted');
    const ended$ = fromEvent(this.rtcSession, 'ended');
    const failed$ = fromEvent(this.rtcSession, 'failed');

    confirmed$.pipe(takeUntil(this._destroy$)).subscribe(() => {
      this.isConfirmed$.next(true);
      this.isPristine$.next(false);
    });

    hold$.pipe(takeUntil(this._destroy$)).subscribe(() => {
      this.isOnHold$.next(this.rtcSession.isOnHold().local);
    });

    unhold$.pipe(takeUntil(this._destroy$)).subscribe(() => {
      this.isOnHold$.next(this.rtcSession.isOnHold().local);
    });

    muted$.pipe(takeUntil(this._destroy$)).subscribe(() => {
      this.isMuted$.next(true);
    });

    unmuted$.pipe(takeUntil(this._destroy$)).subscribe(() => {
      this.isMuted$.next(false);
    });

    const sessionEnd$ = merge(ended$, failed$).pipe(takeUntil(this._destroy$));

    sessionEnd$.subscribe((event) => {
      this.destroy();
    });

    // Голосовая связь
    this._setupTrackHandling();
  }

  private _setupTrackHandling(): void {
    this.connection$
      .pipe(
        filter(Boolean),
        switchMap((connection) => fromEvent<RTCTrackEvent>(connection, 'track')),
        filter((event) => event.track.kind === 'audio'),
        filter((event) => Boolean(event.streams?.[0])),
        switchMap((event) => {
          const { track, streams } = event;
          const stream = streams[0];

          // Создаем новый поток с треком
          const mediaStream = new MediaStream([track]);
          this.remoteTrack$.next(mediaStream);

          if (!stream) {
            console.warn('Поток не получен');
            return EMPTY;
          }

          // Слушаем удаление этого трека
          return fromEvent<MediaStreamTrackEvent>(stream, 'removetrack').pipe(
            filter((removeEvent) => removeEvent.track === track),
            take(1),
            tap(() => {
              this.remoteTrack$.next(null);
            }),
          );
        }),
        takeUntil(this._destroy$),
      )
      .subscribe();
  }

  // Методы управления
  public mute(): void {
    try {
      this.rtcSession.mute();
    } catch (error) {
      console.error('Ошибка при отключении звука:', error);
    }
  }

  public unMute(): void {
    try {
      this.rtcSession.unmute();
    } catch (error) {
      console.error('Ошибка при включении звука:', error);
    }
  }

  public hold(): void {
    if (!this.isConfirmed$.value) {
      console.warn('Невозможно поставить на удержание неподтвержденную сессию');
      return;
    }
    try {
      this.rtcSession.hold();
    } catch (error) {
      console.error('Ошибка при постановке на удержание:', error);
    }
  }

  public unHold(): void {
    if (!this.isConfirmed$.value) {
      console.warn('Невозможно снять с удержания неподтвержденную сессию');
      return;
    }
    try {
      this.rtcSession.unhold();
    } catch (error) {
      console.error('Ошибка при снятии с удержания:', error);
    }
  }

  public answer(config?: Partial<CallOptions>): void {
    try {
      this.rtcSession.answer(config);
    } catch (error) {
      console.error('Ошибка при ответе на вызов:', error);
    }
  }

  // Для корректного прерывания звонка в terminate необходимо передавать status_code:
  // - 486 - Callee is busy
  // - 487 - Request has terminated by bye or cancel
  // - 603 - Decline by Callee
  public finish(code: number = 487): void {
    try {
      this.rtcSession.terminate({ status_code: code });
    } catch (error) {
      // Все равно уничтожаем сессию даже при ошибке
      this.destroy();
    }
  }

  public destroy(): void {
    // Останавливаем все медиа-треки
    const currentTrack = this.remoteTrack$.value;
    if (currentTrack) {
      currentTrack.getTracks().forEach((track) => track.stop());
    }

    this.remoteTrack$.next(null);

    this.remoteTrack$.complete();
    this.isConfirmed$.complete();
    this.isOnHold$.complete();
    this.isMuted$.complete();
    this.isPristine$.complete();
    this.connection$.complete();
    this.remoteTrack$.next(null);
    this._destroy$.next(this.id);
    this._destroy$.complete();
  }
}
