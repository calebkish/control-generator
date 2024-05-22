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
    return `Must be at least ${validatorError.requiredLength} characters long (${validatorError.actualLength}/${validatorError.requiredLength})`;
  } else if (validatorType === 'min') {
    return `Must ${validatorError.min} or greater`;
  } else if (validatorType === 'max') {
    return `Must ${validatorError.max} or smaller`;
  } else if (validatorType === 'notANumber') {
    return 'Must be a number';
  } else if (validatorType === 'invalidSecureUrl') {
    return 'Must be a valid secure URL (starts with "https://")';
  }

  if (typeof validatorError === 'string') {
    return validatorError;
  }

  console.error(validatorType, validatorError);
  throw new Error(`Could not find a corresponding message for the validation error "${validatorType}"`);
}
