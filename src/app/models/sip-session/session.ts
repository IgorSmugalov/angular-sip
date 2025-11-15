import { RTCPeerConnectionDeprecated, RTCSession } from 'jssip/lib/RTCSession';
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
    if (session.connection) {
      this.connection$.next(session.connection);
    } else {
      session.on('peerconnection', (event) => {
        this.connection$.next(event.peerconnection);
      });
    }

    this.id = id;
    this.remoteIdentity = session.remote_identity?.uri?.user;
    this.direction = session.direction;
    this.rtcSession = session;

    this._initListeners();
  }

  public _initListeners() {
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

    // Voice

    const track$ = this.connection$.pipe(
      filter(Boolean),
      switchMap((connection) => fromEvent<RTCTrackEvent>(connection, 'track')),
      filter((event) => event.track.kind === 'audio'),
      filter((event) => Boolean(event.streams[0])),
      takeUntil(this._destroy$),
    );

    track$
      .pipe(
        switchMap((event) => {
          const { track, streams } = event;
          this.remoteTrack$.next(new MediaStream([track]));

          const stream = streams[0];
          if (!stream) {
            console.warn('Stream не получен');
            return EMPTY;
          }

          return fromEvent<MediaStreamTrackEvent>(stream, 'removetrack').pipe(
            take(1),
            tap(() => this.remoteTrack$.next(null)),
          );
        }),
        takeUntil(this._destroy$),
      )
      .subscribe();

    this._destroy$.pipe(take(1)).subscribe(() => {
      this.remoteTrack$.next(null);
    });
  }

  // Control
  public mute(): void {
    this.rtcSession.mute();
  }

  public unMute(): void {
    this.rtcSession.unmute();
  }

  public hold(): void {
    this.rtcSession.hold();
  }

  public unHold(): void {
    this.rtcSession.unhold();
  }

  public answer(): void {
    this.rtcSession.answer({ mediaConstraints: { audio: true, video: false } });
  }

  // Для корректного прерывания звонка в terminate необходимо передавать status_code:
  // - 486 - Callee is busy
  // - 487 - Request has terminated by bye or cancel
  // - 603 - Decline by Callee
  public finish(code: number = 487): void {
    this.rtcSession.terminate({ status_code: code });
  }

  public destroy(): void {
    this.remoteTrack$.next(null);
    this._destroy$.next(this.id);
    this._destroy$.complete();
  }
}
