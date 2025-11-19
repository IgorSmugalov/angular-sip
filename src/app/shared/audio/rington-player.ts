// import { BehaviorSubject, fromEvent, merge, Subject, switchMap, tap, timer } from 'rxjs';
// import { filter } from 'rxjs/operators';
// import { AudioPlayer } from './audio-player';

// interface ICrmRingtonePlayerOptions {
//   repeatInterval: number;
//   volume: number;
// }
//
// export class RingtonePlayer extends AudioPlayer {
//   private _repeatInterval: number;
//   private _intervalId: number | null = null;
//   private readonly canPlay$ = new BehaviorSubject<boolean>(false);
//   private readonly ended$ = new Subject();
//   private readonly stopped$ = new Subject();
//
//   constructor(src: string, options: ICrmRingtonePlayerOptions) {
//     const { repeatInterval = 0, volume = 1 } = options;
//
//     super(src, volume);
//     this._repeatInterval = repeatInterval;
//
//     merge(fromEvent(this._audio!, 'ended'), this.canPlay$.pipe(filter(Boolean)))
//       .pipe(
//         filter(() => !super.isPlaying),
//         filter(() => this.canPlay$.value),
//         switchMap(() => timer(1)),
//       )
//       .subscribe(() => console.log('ended event'));
//
//     fromEvent(this._audio!, 'ended')
//       .pipe(tap(() => console.log('ended event')))
//       .subscribe(() => this.ended$.next(true));
//   }
//
//   public override play(): void {
//     this.canPlay$.next(true);
//     //
//     // if (super.isPlaying) {
//     //   return; // Уже играет - не делаем ничего
//     // }
//     //
//     // if (this._repeatInterval > 0) {
//     //   this._startRepeating();
//     // } else {
//     //   super.play();
//     // }
//   }
//
//   private _startRepeating(): void {
//     super.play(); // Первое воспроизведение
//     this._intervalId = window.setInterval(() => {
//       // Повтор
//       if (this._audio) {
//         this._audio.currentTime = 0;
//         this._audio.play();
//       }
//     }, this._repeatInterval) as unknown as number;
//   }
//
//   public override stop(): void {
//     this.canPlay$.next(false);
//     super.stop();
//     // this._stopRepeating();
//   }
//
//   // private _stopRepeating(): void {
//   //   if (this._intervalId !== null) {
//   //     clearInterval(this._intervalId);
//   //     this._intervalId = null;
//   //   }
//   // }
//
//   public override destroy(): void {
//     this.stop();
//     super.destroy();
//   }
// }

import { AudioPlayer } from './audio-player';

interface ICrmRingtonePlayerOptions {
  repeatInterval: number;
  volume: number;
}

export class RingtonePlayer extends AudioPlayer {
  private _repeatInterval: number;
  private _intervalId: number | null = null;

  constructor(src: string, options: ICrmRingtonePlayerOptions) {
    const { repeatInterval = 0, volume = 1 } = options;

    super(src, volume);
    this._repeatInterval = repeatInterval;
  }

  public override play(): void {
    if (super.isPlaying) {
      return; // Уже играет - не делаем ничего
    }

    if (this._repeatInterval > 0) {
      this._startRepeating();
    } else {
      super.play();
    }
  }

  private _startRepeating(): void {
    super.play(); // Первое воспроизведение
    this._intervalId = window.setInterval(() => {
      // Повтор
      if (this._audio) {
        this._audio.currentTime = 0;
        this._audio.play();
      }
    }, this._repeatInterval) as unknown as number;
  }

  public override stop(): void {
    super.stop();
    this._stopRepeating();
  }

  private _stopRepeating(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  public override destroy(): void {
    this.stop();
    super.destroy();
  }
}
