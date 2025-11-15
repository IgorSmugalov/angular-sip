import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { LocalStorageService } from '@app/shared/utils';
import { debounceTime, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FormCacheService {
  public saveForm(key: string, form: FormGroup): void {
    LocalStorageService.set(key, form.value);
  }

  public loadForm(key: string, form: FormGroup): void {
    const cached = LocalStorageService.get(key);
    if (cached) {
      form.patchValue(cached);
    }
  }

  public clearForm(key: string): void {
    localStorage.removeItem(key);
  }

  public hasCachedForm(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  // public connect(form: FormGroup, cacheKey: string): void {
  //   const value = LocalStorageService.get(cacheKey);
  //   if (value) {
  //     form.patchValue(value);
  //   }
  //   form.valueChanges.pipe(debounceTime(100)).subscribe((value) => {
  //     LocalStorageService.set(cacheKey, form.value);
  //   });
  // }
}
