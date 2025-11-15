import { get } from 'lodash';

export function FormGuard(formPropertyName: string) {
  return function (layer: any, method: string, descriptor: PropertyDescriptor) {
    const fn = descriptor.value;

    descriptor.value = async function (...args: any) {
      const form = get(this, formPropertyName);

      form?.markAsTouched?.();
      form?.markAllAsTouched?.();
      if (form.invalid) {
        console.log(form, form.controls);

        Object.keys(form.controls).forEach((key) => {
          if (form.get(key).invalid) {
            console.log(key, form.get(key));
          }
        });

        return;
      }

      return await fn.call(this, ...args);
    };
  };
}
