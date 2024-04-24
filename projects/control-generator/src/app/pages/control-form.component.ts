import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import { EMPTY, Subject, scan, shareReplay, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ArrayControlComponent } from "../components/controls/array-control.component";
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { TextFieldComponent } from '../components/controls/text-field.component';
import { TextAreaFieldComponent } from "../components/controls/textarea-field.component";
import { SelectFieldComponent, SelectOption } from '../components/controls/select-field.component';
import { TextStreamService } from '../services/text-stream.service';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-form',
    standalone: true,
    templateUrl: 'control-form.component.html',
    imports: [
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatSelectModule,
        MatButtonModule,
        ArrayControlComponent,
        ReactiveFormsModule,
        MatTooltipModule,
        MatSnackBarModule,
        TextFieldComponent,
        TextAreaFieldComponent,
        SelectFieldComponent,
        AsyncPipe,
    ]
})
export class FormComponent {
  fb = inject(NonNullableFormBuilder);
  snackbar = inject(MatSnackBar);
  textStreamService = inject(TextStreamService);

  form = this.fb.group({
    controlType: this.fb.control<string | null>(null, [Validators.required]),
    ipe: this.fb.array<string | null>([]),
    frequency: this.fb.control<string | null>(null, [Validators.required]),
    judgements: this.fb.array<string | null>([]),
    quantitativeThresholds: this.fb.array<string | null>([]),
    qualitativeThresholds: this.fb.array<string | null>([]),
    investigationProcess: this.fb.control<string | null>(null),
    description: this.fb.control<string | null>(null, [Validators.required, Validators.minLength(10)]),
    attributes: this.fb.array<string | null>([]),
  });

  controlTypeOptions: SelectOption<string>[] = [
    {
      label: 'Manual',
      value: 'manual',
    },
    {
      label: 'ITDM',
      value: 'itdm',
    },
  ];

  frequencyOptions: SelectOption<string>[] = [
    {
      label: 'Annual',
      value: 'annual',
    },
    {
      label: 'Quarterly',
      value: 'quarterly',
    },
    {
      label: 'Monthly',
      value: 'monthly',
    },
    {
      label: 'Weekly',
      value: 'weekly',
    },
    {
      label: 'Daily',
      value: 'daily',
    },
    {
      label: 'Recurring',
      value: 'recurring',
    },
    {
      label: 'Ad Hoc',
      value: 'Ad Hoc',
    },
  ];

  onSubmit$ = new Subject<void>();
  onDescriptionAiCritique$ = new Subject<void>();

  llmDescriptionResponse$ = this.onDescriptionAiCritique$.pipe(
    takeUntilDestroyed(),
    switchMap(() => {
      const ctrl = this.form.controls.description;
      if (ctrl.status !== 'VALID' || ctrl.value === null) {
        this.snackbar.open(
          'Please enter a long-enough description to get an AI critique.',
          'Dismiss',
          { duration: 5000, panelClass: 'snackbar-error' }
        );
        ctrl.markAsTouched();
        ctrl.updateValueAndValidity();
        return EMPTY;
      }

      return this.textStreamService.requestTextStream$('http://localhost:4200/api/llm', {
        prompt: `
          You are a chat bot that determines whether or not the user-provided
          control description is sufficient to write an accounting control.

          Here is the user-provided description:

          "${ctrl.value}"

          Is the provided description sufficient? Provide reasons why or why not.
        `,
      }).pipe(
        scan<string, string>((acc, value) => acc + value, ''),
      );
    }),
    takeUntilDestroyed(),
    shareReplay(1),
  );

  constructor() {
    this.onSubmit$.pipe(
      takeUntilDestroyed()
    ).subscribe(() => {
      console.log(this.form.getRawValue());
    });


  }
}
