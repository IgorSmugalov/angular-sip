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
  public sipSessionsService = inject(SipSessionsService);
  public sessions = toSignal(
    this.sipSessionsService.sessions$.pipe(map((sessions) => [...sessions.values()])),
  );
  public selectedSession = toSignal(this.sipSessionsService.selectedSession$);

  public selectSession(id: string) {
    this.sipSessionsService.switchToSession(id);
  }
}
