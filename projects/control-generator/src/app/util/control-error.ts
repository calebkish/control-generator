import { Signal, computed } from '@angular/core';
import { FormControl } from '@angular/forms';

export function formControlError(control: Signal<FormControl>): Signal<string | null> {
  return computed(() => {
    const ctrl = control();

    if (!ctrl.touched) {
      return null;
    }

    const errors = ctrl.errors;

    if (!errors) {
      return null;
    }

    const [validatorType, validatorError]= Object.entries(errors)[0];

    if (validatorType === 'required') {
      return 'Required';
    } else if (validatorType === 'minlength') {
      return `Minimum of ${validatorError.requiredLength} required`;
    }

    if (typeof validatorError === 'string') {
      return validatorError;
    }

    throw new Error(`Could not find a corresponding message for the validation error "${validatorType}"`);
  });
}
