import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export const isNumberValidator = (control: AbstractControl): ValidationErrors | null => {
  if (control.value !== null && typeof control.value !== 'number') {
    return { notANumber: true };
  }
  return null;
};
