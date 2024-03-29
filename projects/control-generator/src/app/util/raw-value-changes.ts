import { AbstractControl } from '@angular/forms';
import { defer, map, startWith } from 'rxjs';

export function rawValueChanges<TValue = any, TRawValue extends TValue = TValue>(
  control: AbstractControl<TValue, TRawValue>,
  emitCurrentValue: boolean = false,
) {
  return defer(() => {
    if (emitCurrentValue) {
      return control.valueChanges.pipe(
        map(() => control.getRawValue() as TRawValue),
        startWith(control.getRawValue() as TRawValue),
      );
    }
    return control.valueChanges.pipe(
      map(() => control.getRawValue() as TRawValue),
    );
  });
}
