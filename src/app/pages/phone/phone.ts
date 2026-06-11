import { Component } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { SipAuthComponent } from '@features/sip-auth';
import { SipCallControlComponent } from '@features/sip-call-control/sip-call-control.component';
import { SipCallsListComponent } from '@features/sip-calls-list/sip-calls-list.component';
import { SipMediaStatusComponent } from '@features/sip-media-status';
import { SipStateComponent } from '@features/sip-state';

@Component({
  selector: 'sip-phone-page',
  imports: [
    SipAuthComponent,
    MatCard,
    SipStateComponent,
    SipMediaStatusComponent,
    SipCallsListComponent,
    SipCallControlComponent,
  ],
  templateUrl: './phone.html',
  styleUrl: './phone.scss',
})
export class SipPhonePage {}
