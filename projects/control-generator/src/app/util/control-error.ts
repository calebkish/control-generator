import { FormControl } from '@angular/forms';

export function getFormControlError(ctrl: FormControl): string | null {
  const errors = ctrl.errors;

  if (!errors) {
    return null;
  }

  const [validatorType, validatorError] = Object.entries(errors)[0];

  if (validatorType === 'required') {
    return 'Required';
  } else if (validatorType === 'minlength') {
    return `Minimum of ${validatorError.requiredLength} required`;
  }

  if (typeof validatorError === 'string') {
    return validatorError;
  }

  throw new Error(`Could not find a corresponding message for the validation error "${validatorType}"`);
}
