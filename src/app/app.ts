import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppThemeComponent } from '@features/theme/app-theme.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppThemeComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('angular-sip');
}
