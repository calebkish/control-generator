import { ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export const patternWithError: (pattern: RegExp, errorKey: string) => ValidatorFn = (pattern, errorKey) => {
  return (control) => {
    const result = Validators.pattern(pattern)(control);
    if (result === null) {
      return result;
    }
    const errors: ValidationErrors = {
      [errorKey]: true,
    };
    return errors;
  };
};
