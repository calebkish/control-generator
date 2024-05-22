import { Component, DestroyRef, Signal, computed, effect, inject, input, output } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subject, concat, exhaustMap, filter, firstValueFrom, map, of, shareReplay, startWith } from 'rxjs';
import { ConfigVm, LlmConfigOptionResponse } from '@http';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SelectFieldComponent, SelectOption } from '../components/controls/select-field.component';
import { TextFieldComponent } from '../components/controls/text-field.component';
import { MatDivider } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { patternWithError } from '../util/pattern-with-error';

@Component({
  selector: 'app-local-llm-option',
  imports: [
    MatProgressBar,
    MatButton,
    MatRadioButton,
    MatProgressSpinner,
  ],
  standalone: true,
  template: `
<div class="flex gap-3 items-center">
  {{ option().option }}
  @if (progress(); as p) {
    @if (!p.completed) {
      <mat-progress-bar mode="determinate" [value]="p.progress" class="!w-48" />
      <div>
        {{ p.progress }}%
      </div>
      <mat-progress-spinner mode="indeterminate" diameter="20" />
    }
  } @else {
    <button mat-button type="button" (click)="download$.next()">Download</button>
  }
</div>
  `,
})
export class LocalLlmOptionComponent {
  private settingsService = inject(SettingsService);
  private destroyRef = inject(DestroyRef);

  option = input.required<LlmConfigOptionResponse>();

  downloadCompleted = output<void>();

  download$ = new Subject<void>();

  progress$: Observable<{
    progress: number;
    completed: boolean;
  }> = this.download$.pipe(
    exhaustMap(() => concat(
      this.settingsService.downloadFile(this.option().option).pipe(
        map(str => parseInt(str)),
        filter(num => !Number.isNaN(num)),
        map(num => ({ progress: num, completed: false })),
        startWith({ progress: 0, completed: false }),
        takeUntilDestroyed(this.destroyRef),
      ),
      of({ progress: 100, completed: true }),
    )),
    shareReplay(1),
    takeUntilDestroyed(this.destroyRef),
  );
  progress = toSignal(this.progress$);

  completed = computed(() => {
    return this.progress()?.completed ?? false;
  })

  constructor() {
    this.progress$.pipe(
      takeUntilDestroyed(),
    ).subscribe(x => {
      if (x.completed) {
        this.downloadCompleted.emit();
      }
    })
  }
}

@Component({
  selector: 'app-model-add-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButton,
    LocalLlmOptionComponent,
    SelectFieldComponent,
    TextFieldComponent,
    MatDivider,
  ],
  template: `
<h2 mat-dialog-title>Add a model</h2>
<mat-dialog-content>
  <div class="flex flex-col gap-5">
    <div>
      <div class="text-lg">Local models</div>
      @for (option of localLlmOptions(); track option) {
        <app-local-llm-option [option]="option" (downloadCompleted)="refetchConfigs()" />
      }
    </div>

    <mat-divider />

    <div class="flex flex-col gap-3">
      <div class="text-lg">Azure OpenAI</div>
      <app-text-field label="API Key" [ctrl]="form.controls.apiKey" />
      <app-text-field label="Endpoint" [ctrl]="form.controls.endpoint" />
      <app-select-field label="Model" [ctrl]="form.controls.option" [options]="azureOpenaiLlmOptions()" />
      <button type="button" mat-flat-button (click)="submit()">Add Azure OpenAI model</button>
    </div>

    <mat-divider />
  </div>
</mat-dialog-content>
<mat-dialog-actions>
  <button mat-button mat-dialog-close>Close</button>
</mat-dialog-actions>
  `,
})
export class ModelAddDialogComponent {
  protected settingsService = inject(SettingsService);
  private fb = inject(NonNullableFormBuilder);
  dialogRef: MatDialogRef<ModelAddDialogComponent> = inject(MatDialogRef);
  snackbar = inject(MatSnackBar);

  form = this.fb.group({
    apiKey: this.fb.control('', [Validators.required, patternWithError(/https:\/\/.*/, 'invalidSecureUrl')]),
    endpoint: this.fb.control('', [Validators.required]),
    option: this.fb.control('', [Validators.required]),
  });

  options$ = this.settingsService.getLlmOptions();
  options = toSignal(this.options$, { initialValue: [] });

  localLlmOptions = computed(() => {
    return this.options().filter(o => o.type === 'LOCAL_LLAMA_V1');
  });

  azureOpenaiLlmOptions: Signal<SelectOption<string>[]> = computed(() => {
    return this.options()
      .filter(o => o.type === 'AZURE_OPENAI_V1')
      .map(o => {
        return {
          label: o.option,
          value: o.option,
        };
      });
  });

  refetchConfigs() {
    this.settingsService.llmConfigsRefetch$.next();
  }

  async submit() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.form.updateValueAndValidity();
      this.snackbar.open('Form is invalid', 'Dimiss', { duration: 5000, panelClass: 'snackbar-error' });
      return;
    }

    await firstValueFrom(this.settingsService.addAzureOpenaiConfig(this.form.getRawValue()));
    this.settingsService.llmConfigsRefetch$.next();
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    MatRadioGroup,
    ReactiveFormsModule,
    MatRadioButton,
    MatIcon,
    MatButton,
  ],
  template: `
<div class="p-3 w-full max-w-3xl h-full mx-auto flex flex-col gap-3">
  <div class="text-4xl font-bold">Settings</div>

  <div class="text-2xl font-bold mt-6">Models</div>
  <mat-radio-group [formControl]="ctrl">
    @for (config of llmConfigs(); track config) {
      <mat-radio-button class="block" [value]="config" [checked]="config.isActive">
        <div class="flex items-center gap-2">
          {{ config.option }}
          <button
            mat-icon-button
            type="button"
            class="button-error"
            (click)="settingsService.deleteConfig$.next(config.id)"
          >
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </mat-radio-button>
    }
  </mat-radio-group>

  <button mat-stroked-button (click)="openDialog()" class="self-start">
    <mat-icon>add</mat-icon>
    Add a model
  </button>
</div>
  `,
})
export class SettingsPageComponent {
  protected settingsService = inject(SettingsService);
  private fb = inject(NonNullableFormBuilder);
  private dialog = inject(MatDialog);

  ctrl = this.fb.control<ConfigVm | null>(null);

  llmConfigs$ = this.settingsService.llmConfigs$
  llmConfigs = toSignal(this.llmConfigs$, { initialValue: [] });

  constructor() {
    this.ctrl.valueChanges.pipe(
      takeUntilDestroyed()
    ).subscribe(config => {
      if (config === null || config.isActive) {
        return;
      }
      this.settingsService.activateConfig$.next(config.id);
    });
  }

  openDialog() {
    this.dialog.open(ModelAddDialogComponent, { width: '35rem' });
  }
}
