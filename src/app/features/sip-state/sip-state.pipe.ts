import { Pipe, PipeTransform } from '@angular/core';
import {
  SIP_STATE_CHANGING,
  SIP_STATE_ERROR,
  SIP_STATE_OFFLINE,
  SIP_STATE_ONLINE,
  TSipState,
} from '@models/sip-agent';

interface ISipStatePipe {
  label: string;
  icon: string;
  color: string;
}

@Pipe({
  name: 'sipState',
})
export class SipStatePipe implements PipeTransform {
  transform(value: TSipState): ISipStatePipe {
    switch (value) {
      case SIP_STATE_OFFLINE:
        return { label: 'Отключен', icon: 'close', color: 'error' };
      case SIP_STATE_ONLINE:
        return { label: 'Подключен', icon: 'check', color: 'accent' };
      case SIP_STATE_CHANGING:
        return { label: 'Смена статуса...', icon: 'cached', color: 'warn' };
      case SIP_STATE_ERROR:
        return { label: 'Ошибка', icon: 'check', color: 'error' };
    }
  }
}
