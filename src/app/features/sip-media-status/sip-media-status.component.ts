import { AsyncPipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { SipSessionsService } from '@models/sip-session';

@Component({
  selector: 'sip-media-status',
  imports: [AsyncPipe, MatIcon, NgClass],
  templateUrl: './sip-media-status.component.html',
  styleUrl: './sip-media-status.component.scss',
})
export class SipMediaStatusComponent {
  private _sipSessionsService = inject(SipSessionsService);

  public session = toSignal(this._sipSessionsService.selectedSession$);
}
