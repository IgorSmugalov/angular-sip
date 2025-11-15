export class AudioPlayer {
  protected _audio: HTMLAudioElement | null = null;

  constructor(src: string | MediaStream, volume: number = 1) {
    this._audio = new Audio();
    if (src instanceof MediaStream) {
      this._audio.srcObject = src;
    }
    if (typeof src === 'string') {
      this._audio.src = src;
    }
    this._audio.preload = 'auto';
    this._audio.volume = volume;
  }

  public play(): void {
    this.stop();
    this._audio!.currentTime = 0;
    const playPromise = this._audio!.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn('Autoplay prevented:', error);
      });
    }
  }

  public stop(): void {
    if (this._audio) {
      this._audio.pause();
      this._audio.currentTime = 0;
    }
  }

  setVolume(volume: number): void {
    if (this._audio) {
      this._audio.volume = volume;
    }
  }

  get isPlaying(): boolean {
    if (!this._audio) {
      return false;
    }

    // Проверяем, что аудио не на паузе и currentTime > 0 (т.е. играет)
    // или currentTime > 0 и paused = false
    return !this._audio.paused && this._audio.currentTime > 0;
  }

  public destroy(): void {
    this.stop();
    this._audio = null;
  }
}
