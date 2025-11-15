import { inject, Injectable } from '@angular/core';
import { AudioPlayer } from '@app/shared/audio';
import { SipSessionsService } from '@models/sip-session';
import { filter, of, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SipAudioService {
  private _sipSessionsService = inject(SipSessionsService);
  private _remoteVoiceAudio: AudioPlayer | null = null;

  //
  private _selectedSession$ = this._sipSessionsService.selectedSession$;

  constructor() {
    console.log('SipAudioService constructor');
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
