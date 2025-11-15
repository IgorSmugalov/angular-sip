import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SipStatePipe } from '@features/sip-state/sip-state.pipe';
import { SipAgentService } from '@models/sip-agent/agent.service';
import { startWith } from 'rxjs/operators';

@Component({
  selector: 'sip-state',
  imports: [MatButton, SipStatePipe, MatIcon, NgClass],
  templateUrl: './sip-state.component.html',
  styleUrl: './sip-state.component.scss',
})
export class SipStateComponent {
  private _sipAgentService = inject(SipAgentService);

  public agent = toSignal(this._sipAgentService.agent$);
  public state = this._sipAgentService.state;

  public ngOnInit() {}

  public connect() {
    this.state.setValue('online');
    // this._sipAgentService.start();
  }

  public disconnect() {
    this.state.setValue('offline');

    // this._sipAgentService.stop();
  }
}
