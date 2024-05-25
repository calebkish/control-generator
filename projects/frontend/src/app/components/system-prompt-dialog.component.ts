import { Component, inject } from '@angular/core';
import { TextAreaFieldComponent } from './controls/textarea-field.component';
import { NonNullableFormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

export type SystemPromptDialogData = {
  systemPrompt: string;
  mode?: 'readonly' | 'edit';
}

@Component({
  selector: 'app-system-prompt-dialog',
  standalone: true,
  imports: [
    TextAreaFieldComponent,
    MatDialogModule,
    MatButton,
  ],
  template: `
<h2 mat-dialog-title>Edit System Prompt</h2>
<mat-dialog-content>
  @if (data.mode === 'readonly') {
    <div class="whitespace-pre-wrap">{{ data.systemPrompt }}</div>
  } @else {
    <app-textarea-field label="System prompt" [ctrl]="systemPromptCtrl" [rows]="15" />
  }
</mat-dialog-content>
<mat-dialog-actions>
  @if (data.mode === 'readonly') {
    <button mat-button mat-dialog-close>Close</button>
  } @else {
    <button mat-button (click)="onNoClick()">Cancel</button>
    <button mat-button [mat-dialog-close]="systemPromptCtrl.value">Ok</button>
  }
</mat-dialog-actions>
  `,
})
export class SystemPromptDialogComponent {
  private fb = inject(NonNullableFormBuilder);
  data: SystemPromptDialogData = inject(MAT_DIALOG_DATA);
  dialogRef: MatDialogRef<SystemPromptDialogComponent> = inject(MatDialogRef);

  systemPromptCtrl = this.fb.control<string>('');

  constructor() {
    this.systemPromptCtrl.setValue(this.data.systemPrompt);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
