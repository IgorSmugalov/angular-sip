import { inject, Injectable } from '@angular/core';
import { AudioPlayer } from '@app/shared/audio';
import { RingtonePlayer } from '@app/shared/audio/rington-player';
import { SipSessionsService } from '@models/sip-session';
import { filter, map, merge, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { pairwise, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SipAudioService {
  private _sipSessionsService = inject(SipSessionsService);
  private _remoteVoiceAudio: AudioPlayer | null = null;

  public readonly incomingPrimaryNotification = new RingtonePlayer(
    './assets/audio/primary-incoming.mp3',
    { repeatInterval: 14000, volume: 1 },
  );
  public readonly incomingSecondaryNotification = new RingtonePlayer(
    '/assets/audio/secondary-incoming.mp3',
    { repeatInterval: 4000, volume: 0.5 },
  );

  //
  private _selectedSession$ = this._sipSessionsService.selectedSession$;

  constructor() {
    const sessions$ = this._sipSessionsService.sessions$;

    // При изменении списка сессий проверяет наличие новых сессий
    const newSessions$ = sessions$.pipe(
      pairwise(),
      filter(([prevSessions, currSessions]) => {
        const prevKeys = new Set(prevSessions.keys());
        const currKeys = new Set(currSessions.keys());

        for (const key of currKeys) {
          if (!prevKeys.has(key)) {
            return true; // Появилась новая сессия
          }
        }

        return false; // Новых сессий нет
      }),
      map(([, currSessions]) => [...currSessions.values()]),
      shareReplay(),
    );
    // .subscribe((sessions) => {
    //   console.log('sessions', sessions);
    // });

    // Формирует список сессий для которых нужно воспроизвести уведомление
    // Сессия подходит, если она входящая и с ней не было взаимодействия
    const newSessionsForNotifying$ = sessions$.pipe(
      map((sessions) =>
        [...sessions.values()].filter(
          (session) => session.direction === 'incoming' && session.isPristine$.value,
        ),
      ),
    );
    // Управляет воспроизведением рингтона
    // newSessionsForNotifying$
    //   .pipe(
    //     tap((sessions) => {
    //       if (sessions.length > 0) {
    //         console.log('incomingPrimaryNotification::play', sessions);
    //         this.incomingPrimaryNotification.play();
    //       }
    //     }),
    //     // Реализация остановки проигрывания рингтона
    //     switchMap((sessions) => {
    //       // 1. Если список сессий пуст
    //       if (sessions.length === 0) {
    //         return of(null);
    //       }
    //
    //       console.log('incomingPrimaryNotification::play', sessions);
    //       this.incomingPrimaryNotification.play();
    //
    //       // Список Observables из статусов isPristine$ - звонки с которыми не было взаимодействия
    //       const callsIsPristineStates$: Observable<boolean>[] = sessions.map(
    //         (session) => session.isPristine$,
    //       );
    //       // 2. Если произошло взаимодействие с любой из сессий
    //       return merge(...callsIsPristineStates$).pipe(take(1));
    //     }),
    //     // Останавливаем рингтоны
    //     tap((sessions) => {
    //       console.log('incomingPrimaryNotification::stop', sessions);
    //       // this.incomingPrimaryNotification.stop();
    //       // this.incomingSecondaryNotification.stop();
    //     }),
    //   )
    //   .subscribe();

    newSessionsForNotifying$
      .pipe(
        // 1 map -> создает массив звонков
        // map((map) => {
        //   return Array.from(map, ([, session]) => session);
        // }),
        // 2 map -> оставляем в массиве необработанные входящие вызовы
        // map((sessions) => {
        //   return sessions.filter((session) => {
        //     return session.direction === 'incoming' && session.isPristine$.value;
        //   });
        // }),
        // switchMap -> переподписывается на новые звонки при изменении sessions$
        switchMap((sessions) => {
          // новых звонков нет, отключаем уведомление
          if (!sessions.length) {
            return of(null);
          }
          // новые звонки есть, включаем уведомление
          if (this._sipSessionsService.selectedSession$.value) {
            console.log('start 2', this._sipSessionsService.selectedSession$.value);
            this.incomingSecondaryNotification.play();
          } else {
            console.log('start 1', this._sipSessionsService.selectedSession$.value);
            this.incomingPrimaryNotification.play();
          }

          // Список Observables на основе isPristine$ звонков с которыми не было взаимодействия
          const arr = sessions.map((session) =>
            session.isPristine$.pipe(
              filter((_) => !_),
              take(1),
            ),
          );

          // при изменении isPristine$ любого звонка - отключаем уведомление
          return merge(...arr).pipe(take(1));
        }),
        tap(() => {
          console.log('stop');
          this.incomingPrimaryNotification.stop();
          this.incomingSecondaryNotification.stop();

          // this.stopNotify();
        }),
      )
      .subscribe();

    this._selectedSession$
      .pipe(
        tap(() => {
          if (this._remoteVoiceAudio) {
            this._remoteVoiceAudio.destroy();
            this._remoteVoiceAudio = null;
          }
        }),
        switchMap((session) => {
          return session ? session.remoteTrack$ : of(null);
        }),
        filter(Boolean),
        tap((track) => {
          this._remoteVoiceAudio = new AudioPlayer(track);
          this._remoteVoiceAudio.play();
        }),
      )
      .subscribe();
  }

  public init() {}
}
