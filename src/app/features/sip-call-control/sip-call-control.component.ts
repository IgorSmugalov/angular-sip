import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatListItem } from '@angular/material/list';
import { FormGuard } from '@app/shared/decorators';
import { LocalStorageService } from '@app/shared/utils';
import { SipSessionsService } from '@models/sip-session';
import { filter, map } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'sip-call-control',
  imports: [
    AsyncPipe,
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    FormsModule,
    MatIconButton,
    MatIcon,
  ],
  templateUrl: './sip-call-control.component.html',
  styleUrl: './sip-call-control.component.scss',
})
export class SipCallControlComponent {
  private _destroyRef = inject(DestroyRef);

  public addressee = new FormControl<string>('', [Validators.required]);

  private _sipSessionsService = inject(SipSessionsService);

  public selectedSession = toSignal(this._sipSessionsService.selectedSession$);
  private _selectedSession$ = this._sipSessionsService.selectedSession$;

  public phones = signal<string[]>([]);
  private _phones$ = toObservable(this.phones);
  public filteredPhones = signal<string[]>([]);

  public ngOnInit(): void {
    const phones = LocalStorageService.get('phoneNumbers', []);
    this.phones.set(phones as string[]);

    this._selectedSession$
      .pipe(takeUntilDestroyed(this._destroyRef), filter(Boolean))
      .subscribe((session) => {
        this.addressee.setValue(session ? session.remoteIdentity : null);
        if (session.remoteIdentity) {
          this.phones.update((phones) => {
            if (phones.includes(session.remoteIdentity)) {
              return phones;
            }
            LocalStorageService.set('phoneNumbers', [session.remoteIdentity, ...phones]);
            return [session.remoteIdentity, ...phones];
          });
        }
      });

    combineLatest([
      this.addressee.valueChanges.pipe(startWith(this.addressee.value)),
      this._phones$,
    ])
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(([addressee]) => {
        const filteredPhones = this.phones().filter((phone) => {
          return phone.includes(addressee!);
        });
        this.filteredPhones.set(filteredPhones);
      });
  }

  @FormGuard('addressee')
  public initCall(): void {
    this._sipSessionsService.initCall(this.addressee.value!);
  }

  public onDeletePhone(phone: string) {
    this.phones.update((phones) => {
      return phones.filter((_phone) => _phone !== phone);
    });
  }

  public unselectSession(): void {
    this._sipSessionsService.switchToSession(null);
  }
}
