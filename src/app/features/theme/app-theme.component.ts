import { Component, DOCUMENT, effect, inject, Renderer2, signal } from '@angular/core';
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

  public theme = signal<'dark' | 'light'>('dark');

  constructor() {
    effect(() => {
      if (this.theme() === 'light') {
        this.setLightTheme();
      } else {
        this.setDarkTheme();
      }
    });
  }

  ngOnInit() {
    this.theme.set(this._isUserPreferredDarkTheme() ? 'dark' : 'light');
  }

  private _isUserPreferredDarkTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)');
  }

  public toggleTheme() {
    this.theme.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
  }

  setDarkTheme(): void {
    this._document.body.classList.add('dark-theme');
  }

  setLightTheme(): void {
    this._document.body.classList.remove('dark-theme');
  }
}
