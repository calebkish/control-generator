import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SelectFieldComponent } from '../../components/controls/select-field.component';
import { TextFieldComponent } from '../../components/controls/text-field.component';
import { MatDivider } from '@angular/material/divider';
import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { ConfigVm } from '../../../../../desktop/src/http-server/models';
import { getOpenAiModelOptions } from '../settings-page.component';

@Component({
  selector: 'app-config-edit-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButton,
    SelectFieldComponent,
    TextFieldComponent,
    MatDivider,
  ],
  template: `
<h2 mat-dialog-title>Edit Config</h2>

<mat-dialog-content>
  <div class="flex flex-col gap-5">
    <div class="flex flex-col gap-3">
      <app-select-field label="Model" [ctrl]="form.controls.model" [options]="openaiModelOptions" />
      <button type="button" mat-flat-button (click)="submit()">Update</button>
    </div>
  </div>
</mat-dialog-content>

<mat-dialog-actions>
  <button mat-button mat-dialog-close>Close</button>
</mat-dialog-actions>
  `,
})
export class ConfigEditDialogComponent {
  protected settingsService = inject(SettingsService);
  private fb = inject(NonNullableFormBuilder);
  private dialogRef: MatDialogRef<ConfigEditDialogComponent> = inject(MatDialogRef);
  private snackbar = inject(MatSnackBar);
  private dialogData: ConfigEditDialogData = inject(MAT_DIALOG_DATA);

  form = this.fb.group({
    model: this.fb.control<string | null>(null, [Validators.required]),
  });

  openaiModelOptions = getOpenAiModelOptions(this.dialogData.config.option);

  constructor() {
    this.form.controls.model.setValue(this.dialogData.config.model ?? null);
  }

  async submit() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.form.updateValueAndValidity();
      this.snackbar.open('Form is invalid', 'Dimiss', { duration: 5000, panelClass: 'snackbar-error' });
      return;
    }

    const model = this.form.controls.model.getRawValue();
    await firstValueFrom(this.settingsService.updateOpenaiConfigModel({
      model: model!, // just assume it isn't null if form is valid
      option: this.dialogData.config.option,
    }));
    this.settingsService.llmConfigsRefetch$.next();
    this.dialogRef.close();
  }
}

export interface ConfigEditDialogData {
  config: ConfigVm;
}
