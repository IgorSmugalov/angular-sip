import { AsyncPipe, KeyValuePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDivider, MatList, MatListItem } from '@angular/material/list';
import { SipSessionsService } from '@models/sip-session';
import { BehaviorSubject, map, Subject } from 'rxjs';

@Component({
  selector: 'sip-calls-list',
  imports: [AsyncPipe, MatButton, MatList, MatListItem, MatDivider, MatIcon],
  templateUrl: './sip-calls-list.component.html',
  styleUrl: './sip-calls-list.component.scss',
})
export class SipCallsListComponent {
  private _sipSessionsService = inject(SipSessionsService);
  public sessions = toSignal(
    this._sipSessionsService.sessions$.pipe(map((sessions) => [...sessions.values()])),
  );
  public selectedSession = toSignal(this._sipSessionsService.selectedSession$);

  public selectSession(id: string) {
    this._sipSessionsService.switchToSession(id);
  }
}
