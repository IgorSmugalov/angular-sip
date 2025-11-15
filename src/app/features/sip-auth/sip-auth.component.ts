import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { FormCacheService, FormGuard } from '@app/shared/decorators';
import { ISipAgentCredentials, SIP_CREDENTIALS, SipAgentService } from '@models/sip-agent';
import { interval } from 'rxjs';

@Component({
  selector: 'sip-auth',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    FormsModule,
    MatButton,
    MatError,
  ],
  templateUrl: './sip-auth.component.html',
  styleUrl: './sip-auth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SipAuthComponent {
  private _formCacheService = inject(FormCacheService);
  private _sipCredentials = inject(SIP_CREDENTIALS);
  private _sipAgentService = inject(SipAgentService);

  public form = new FormGroup({
    login: new FormControl(null, [Validators.required]),
    password: new FormControl(null, [Validators.required]),
    url: new FormControl(null, [Validators.required]),
  });

  flashTrigger = 'idle';

  myObservable$ = interval(4000); // Новое значение каждые 4 секунды

  constructor() {
    this.myObservable$.subscribe(() => {
      this.flashTrigger = 'idle'; // Сбрасываем
      setTimeout(() => (this.flashTrigger = 'flash'), 0); // Запускаем анимацию
    });
  }

  public agent = toSignal(this._sipAgentService.agent$);

  @FormGuard('form')
  public onSubmit() {
    const form = this.form.value;

    const params: ISipAgentCredentials = {
      sip_number: form.login!,
      sip_password: form.password!,
      url: form.url!,
    };

    this._sipCredentials.next(params);
  }

  public ngOnInit() {
    this._formCacheService.loadForm('SipAuth', this.form);
    this.form.valueChanges.subscribe(() => {
      this._formCacheService.saveForm('SipAuth', this.form);
    });
  }
}
