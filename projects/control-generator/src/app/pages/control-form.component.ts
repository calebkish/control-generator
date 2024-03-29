import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ArrayControlComponent } from "../components/array-control.component";

export type SelectOption<T> = {
  label: string;
  value: T;
}

@Component({
    selector: 'app-form',
    standalone: true,
    template: `
<div class="flex flex-col gap-4 w-full max-w-lg">
  <mat-form-field subscriptSizing="dynamic">
    <mat-label>Control Type</mat-label>
    <mat-select [formControl]="form.controls.controlType">
      @for (option of controlTypeOptions; track option.value) {
        <mat-option [value]="option.value">{{ option.label }}</mat-option>
      }
    </mat-select>
  </mat-form-field>

  <app-array-control label="IPE" [arrayCtrl]="form.controls.ipe" />

  <mat-form-field subscriptSizing="dynamic">
    <mat-label>Frequency</mat-label>
    <mat-select [formControl]="form.controls.frequency">
      @for (option of frequencyOptions; track option.value) {
        <mat-option [value]="option.value">{{ option.label }}</mat-option>
      }
    </mat-select>
  </mat-form-field>

  <app-array-control label="Judgements" [arrayCtrl]="form.controls.judgements" />

  <app-array-control label="Quantitative Thresholds" [arrayCtrl]="form.controls.quantitativeThresholds" />

  <app-array-control label="Qualitative Thresholds" [arrayCtrl]="form.controls.qualitativeThresholds" />

  <mat-form-field subscriptSizing="dynamic">
    <mat-label>Investigation and Resolution Process</mat-label>
    <textarea matInput [formControl]="form.controls.investigationProcess"></textarea>
    <mat-hint>Describe the investigation and resolution process</mat-hint>
  </mat-form-field>

  <mat-form-field subscriptSizing="dynamic">
    <mat-label>Control description</mat-label>
    <textarea matInput [formControl]="form.controls.controlDescription"></textarea>
    <mat-hint>Please provide a detailed description of all activity occuring to achieve the objective of this control</mat-hint>
  </mat-form-field>

  <button mat-flat-button type="button" (click)="onSubmit$.next()">
    Submit
  </button>
</div>
  `,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatButtonModule,
    ArrayControlComponent,
    ReactiveFormsModule,
  ],
})
export class FormComponent {
  fb = inject(NonNullableFormBuilder);

  form = this.fb.group({
    controlType: this.fb.control<string | null>(null),
    ipe: this.fb.array<string | null>([]),
    frequency: this.fb.control<string | null>(null),
    judgements: this.fb.array<string | null>([]),
    quantitativeThresholds: this.fb.array<string | null>([]),
    qualitativeThresholds: this.fb.array<string | null>([]),
    investigationProcess: this.fb.control<string | null>(null),
    controlDescription: this.fb.control<string | null>(null),
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

  constructor() {
    this.onSubmit$.pipe(
      takeUntilDestroyed()
    ).subscribe(() => {
      console.log(this.form.getRawValue());
    });
  }
}
