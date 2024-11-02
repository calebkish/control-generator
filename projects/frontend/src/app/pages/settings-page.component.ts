import { Component, DestroyRef, Signal, computed, effect, inject, input, output } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subject, concat, distinctUntilChanged, exhaustMap, filter, firstValueFrom, map, of, shareReplay, startWith, switchMap } from 'rxjs';
import { ConfigVm, LlmConfigOptionResponse } from '@http';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SelectFieldComponent, SelectOption } from '../components/controls/select-field.component';
import { TextFieldComponent } from '../components/controls/text-field.component';
import { MatDivider } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { patternWithError } from '../util/pattern-with-error';
import { LlmConfigOpenAiOption } from '../../../../desktop/src/http-server/db/schema';
import { ConfigEditDialogComponent, ConfigEditDialogData } from './settings/config-edit-dialog.component';

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
  <div>{{ option().option }}</div>
  @if (progress(); as p) {
    <mat-progress-bar mode="determinate" [value]="p.progress" class="!w-48" />
    <div>{{ p.progress }}%</div>
    @if (!p.completed) {
      <mat-progress-spinner mode="indeterminate" diameter="20" />
    } @else {
      <div>Download completed!</div>
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

export function getOpenAiModelOptions(vendor: string) {
  if (vendor === 'Azure OpenAI') {
    return [
      { label: 'GPT-4', value: 'gpt-4' },
      { label: 'GPT-4o mini', value: 'gpt-4o-mini' }, // should be used in place of GPT 3.5 turbo
    ];
  } else if (vendor === 'OpenAI') {
    return [
      { label: 'GPT-4o mini', value: 'gpt-4o-mini' }, // should be used in place of GPT 3.5 turbo
      { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
      { label: 'GPT-4', value: 'gpt-4' },
    ];
  }
  return [];
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
      <div class="text-lg">OpenAI</div>
      <app-select-field label="Vendor" [ctrl]="form.controls.option" [options]="openaiLlmVendors()" />
      @if (openaiModelOptions().length > 0) {
        <app-select-field label="Model" hint="You'll be able to change this later" [ctrl]="form.controls.model" [options]="openaiModelOptions()" />
      }
      <app-text-field label="Endpoint" hint="e.g. https://api.openai.com/v1/" [ctrl]="form.controls.endpoint" />
      <app-text-field label="API Key" [ctrl]="form.controls.apiKey" />
      <button type="button" mat-flat-button (click)="submit()">Add OpenAI model</button>
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
    apiKey: this.fb.control('', [Validators.required]),
    endpoint: this.fb.control('', [Validators.required, patternWithError(/^https:\/\/.*/, 'invalidSecureUrl')]),
    option: this.fb.control('', [Validators.required]),
    model: this.fb.control<LlmConfigOpenAiOption | null>(null, [Validators.required]),
  });

  options$ = this.settingsService.getLlmOptions();
  options = toSignal(this.options$, { initialValue: [] });

  localLlmOptions = computed(() => {
    return this.options().filter(o => o.type === 'LOCAL_LLAMA_V1');
  });

  openaiLlmVendors: Signal<SelectOption<string>[]> = computed(() => {
    return this.options()
      .filter(o => o.type === 'OPENAI_V1')
      .map(o => {
        return {
          label: o.option,
          value: o.option,
        };
      });
  });

  selectedOpenaiVendor = toSignal(this.form.controls.option.valueChanges, { initialValue: this.form.controls.option.value });

  openaiModelOptions: Signal<SelectOption<string | null>[]> = computed(() => {
    const selectedOpenaiVendor = this.selectedOpenaiVendor();
    return getOpenAiModelOptions(selectedOpenaiVendor);
  });

  constructor() {
    this.form.controls.option.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe(() => {
      this.form.controls.model.reset();
    });
  }

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

    await firstValueFrom(this.settingsService.addOpenaiConfig(this.form.getRawValue()));
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
    MatIconButton,
    MatButton,
  ],
  template: `
<div class="p-3 w-full max-w-3xl h-full mx-auto flex flex-col gap-3">
  <div class="text-4xl font-bold">Settings</div>

  <div class="text-2xl font-bold mt-6">Models</div>
  <mat-radio-group [formControl]="configCtrl">
    @for (config of llmConfigs(); track config) {
      <div class="flex items-center gap-1">
        <mat-radio-button class="block" [value]="config" [checked]="config.isActive">
            {{ config.option }}
        </mat-radio-button>
        @if (config.type === 'OPENAI_V1') {
          <button
            mat-icon-button
            type="button"
            (click)="$event.stopPropagation(); openConfigEditDialog(config)"
          >
            <mat-icon>edit</mat-icon>
          </button>
        }
        <button
          mat-icon-button
          type="button"
          class="button-error"
          (click)="settingsService.deleteConfig$.next(config.id)"
        >
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    }
  </mat-radio-group>

  <button mat-stroked-button (click)="openAddModelDialog()" class="self-start">
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

  configCtrl = this.fb.control<ConfigVm | null>(null);

  llmConfigs$ = this.settingsService.llmConfigs$;
  llmConfigs = toSignal(this.llmConfigs$, { initialValue: [] });

  constructor() {
    this.configCtrl.valueChanges.pipe(
      takeUntilDestroyed()
    ).subscribe(config => {
      if (config === null || config.isActive) {
        return;
      }
      this.settingsService.activateConfig$.next(config.id);
    });
  }

  openAddModelDialog() {
    this.dialog.open(ModelAddDialogComponent, { width: '35rem' });
  }

  openConfigEditDialog(config: ConfigVm) {
    this.dialog.open<ConfigEditDialogComponent, ConfigEditDialogData>(
      ConfigEditDialogComponent,
      { width: '35rem', data: { config } }
    );
  }
}
