import { Component, computed, inject, input } from '@angular/core';
import { FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-array-field',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
  template: `
  <div class="border-2 border-gray-200 p-3 rounded-md flex flex-col">
    <div class="text-gray-500 mb-3">{{ label() }}</div>

    <div class="flex flex-col gap-3">
      @for (control of arrayControls(); track control; let idx = $index) {
        <div class="flex gap-2 mb-3 items-center">
          <mat-form-field subscriptSizing="dynamic" class="w-full">
            <!-- <input matInput [formControl]="control" /> -->
            <textarea matInput [formControl]="control"></textarea>
          </mat-form-field>
          <button type="button" mat-icon-button (click)="controlArrayRemove$.next(idx)">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      }
    </div>

    <button type="button" mat-button (click)="controlArrayAdd$.next()">
      Add
      <mat-icon>add</mat-icon>
    </button>
  </div>
  `,
  styles: ``
})
export class ArrayFieldComponent<T> {
  fb = inject(NonNullableFormBuilder);

  arrayCtrl = input.required<FormArray<FormControl<T | null>>>();
  label = input.required<string>();

  arrayControls = computed(() => {
    const arrayCtrl = this.arrayCtrl();
    return arrayCtrl.controls;
  });

  controlArrayAdd$ = new Subject<void>();
  controlArrayRemove$ = new Subject<number>();

  constructor() {
    this.controlArrayAdd$.pipe(
      takeUntilDestroyed(),
    ).subscribe(() => {
      const newControl = this.fb.control<T | null>(null);
      this.arrayCtrl().push(newControl);
    });

    this.controlArrayRemove$.pipe(
      takeUntilDestroyed(),
    ).subscribe((i) => {
      this.arrayCtrl().removeAt(i);
    });
  }
}
