import { Component, DOCUMENT, effect, HostListener, inject, signal } from '@angular/core';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-theme',
  imports: [MatIcon, MatFabButton],
  templateUrl: './app-theme.component.html',
  styleUrl: './app-theme.component.scss',
})
export class AppThemeComponent {
  private _document = inject(DOCUMENT);

  public isPageVisible = signal<boolean>(!document.hidden);
  public theme = signal<'dark' | 'light'>('dark');

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    const isVisible = !document.hidden && document.visibilityState === 'visible';
    this.isPageVisible.set(isVisible);
    console.log('Page visible:', isVisible);
  }

  @HostListener('window:focus')
  onFocus() {
    this.isPageVisible.set(true);
    console.log('Window focused - page visible');
  }

  @HostListener('window:blur')
  onBlur() {
    this.isPageVisible.set(false);
    console.log('Window blurred - page hidden');
  }

  constructor() {
    effect(() => {
      if (this.theme() === 'light') {
        this.setLightTheme();
      } else {
        this.setDarkTheme();
      }
    });

    // Мониторинг каждые 2 секунды
    setInterval(() => {
      const isVisible =
        !document.hidden && document.visibilityState === 'visible' && document.hasFocus();
      this.isPageVisible.set(isVisible);
      console.log('Current page visibility:', isVisible);
    }, 2000);
  }

  ngOnInit() {
    // Проверяем начальное состояние
    const initialVisibility = !document.hidden && document.visibilityState === 'visible';
    this.isPageVisible.set(initialVisibility);
    this.theme.set(this._isUserPreferredDarkTheme().matches ? 'dark' : 'light');
  }

  private _isUserPreferredDarkTheme(): MediaQueryList {
    return window.matchMedia('(prefers-color-scheme: dark)');
  }

  public toggleTheme() {
    this.theme.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
  }

  setDarkTheme(): void {
    this._document.body.classList.add('dark-theme');
    this._document.body.classList.remove('light-theme');
  }

  setLightTheme(): void {
    this._document.body.classList.add('light-theme');
    this._document.body.classList.remove('dark-theme');
  }
}
