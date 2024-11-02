import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import { Subject, firstValueFrom, map, shareReplay, skip } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAnchor, MatButtonModule, MatMiniFabButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { TextFieldComponent } from '../components/controls/text-field.component';
import { TextAreaFieldComponent } from "../components/controls/textarea-field.component";
import { SelectFieldComponent, SelectOption } from '../components/controls/select-field.component';
import { NumberFieldComponent } from '../components/controls/number-field.component';
import { controlNameValidators } from './controls-page.component';
import { HttpControlsService } from '../services/http-controls.service';
import { ControlSchemaV1 } from '@http';
import { Router, RouterLink } from '@angular/router';
import { MatDivider } from '@angular/material/divider';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { TipsAndTricksSidenavComponent } from '../components/tips-and-track-sidenav.component';
import { environment } from '../../environment/environment';
import { validateFormForAttributesRoadmap } from '../corpus/attributes-roadmap-assist';
import { validateFormForAttributesAssist } from '../corpus/attributes-assist';
import { validateFormForDescription } from '../corpus/description-assist';

@Component({
  selector: 'app-control-form-page',
  standalone: true,
  templateUrl: 'control-form-page.component.html',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatSnackBarModule,
    TextFieldComponent,
    TextAreaFieldComponent,
    SelectFieldComponent,
    NumberFieldComponent,
    MatAnchor,
    RouterLink,
    MatDivider,
    JsonPipe,
    AsyncPipe,
    MatSidenavModule,
    MatMiniFabButton,
    TipsAndTricksSidenavComponent,
  ],
})
export class ControlFormPageComponent {
  private fb = inject(NonNullableFormBuilder);
  private snackbar = inject(MatSnackBar);
  private controlsService = inject(HttpControlsService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  controlId = input.required<number, string>({ transform: (val) => parseInt(val) });

  form = this.fb.group({
    name: this.fb.control<string>('', controlNameValidators),
    gpc: this.fb.control<string>(''),
    objective: this.fb.control<string>(''),
    controlType: this.fb.control<string>(''),
    frequency: this.fb.control<string>(''),
    ipc: this.fb.control<string>(''), // yes/no
    judgementComplexityInvolved: this.fb.control<string>(''), // yes/no
    quantitativeThresholds: this.fb.control<string>(''), // yes/no
    qualitativeThresholds: this.fb.control<string>(''), // yes/no
    investigationProcess: this.fb.control<string>(''), // yes/no
  }, {
    validators: [
      (control) => {
        const value = control.getRawValue();
        if (value.controlType === 'itdm' && !value.ipc) {
          return { formError: 'Control type is ITDM. Please provide the IPC.' };
        }
        return null;
      }
    ]
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

  yesNoOptions: SelectOption<boolean>[] = [
    {
      label: 'Yes',
      value: true
    },
    {
      label: 'No',
      value: false
    },
  ];

  onSubmit$ = new Subject<void>();

  shouldShowIpc$ = this.form.valueChanges.pipe(
    map(value => value?.controlType === 'itdm'),
    takeUntilDestroyed(),
    shareReplay(1),
  );

  /** Used for whether to enable/disable buttons */
  controlFormValue = signal<ControlSchemaV1['value']['form'] | null>(null);

  editDescriptionAllowed = computed(() => {
    const f = this.controlFormValue();
    if (f === null) {
      return { allowed: false };
    }
    const errorMessage = validateFormForDescription(f);
    if (errorMessage) {
      return {
        allowed: false,
        message: errorMessage,
      };
    }
    return { allowed: true };
  });

  attributesRoadmapAllowed = computed(() => {
    const f = this.controlFormValue();
    if (f === null) {
      return { allowed: false };
    }
    const errorMessage = validateFormForAttributesRoadmap(f);
    if (errorMessage) {
      return {
        allowed: false,
        message: errorMessage,
      };
    }
    return { allowed: true };
  });

  controlDesignerAllowed = computed(() => {
    const f = this.controlFormValue();
    if (f === null) {
      return { allowed: false };
    }
    const errorMessage = validateFormForAttributesAssist(f);
    if (errorMessage) {
      return {
        allowed: false,
        message: errorMessage,
      };
    }
    return { allowed: true };
  });



  onNavigate(subRoute: string) {
    if (this.formDirty()) {
      this.snackbar.open('Please save the form first', 'Dismiss', { duration: 3000, verticalPosition: 'top', panelClass: 'snackbar-error' });
      return;
    }
    this.router.navigate(['controls', 'form', this.controlId(), subRoute]);
  }

  formDirty = signal(false);

  isSaving = signal(false);

  async ngOnInit() {
    this.form.valueChanges.pipe(
      skip(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.formDirty.set(true);
    });

    this.onSubmit$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(async () => {
      if (!this.form.valid) {
        const formError = this.form.errors?.['formError'];
        const message = formError ? `Form is invalid: ${formError}` : 'Form is invalid';
        this.snackbar.open(message, 'Dismiss', { duration: 5000, verticalPosition: 'top', panelClass: 'snackbar-error' });
        return;
      }

      const patch = this.formViewModelToModel();
      this.controlFormValue.update(v => ({
        ...v,
        ...patch
      }));

      this.saveForm();
      this.snackbar.open('Saved!', 'Dismiss', { duration: 3000, verticalPosition: 'top' });
      this.controlsService.fetchControlsRequest$.next();
      this.formDirty.set(false);
    });

    const res = await firstValueFrom(this.controlsService.getControl(this.controlId()));
    const formValue = res.document.value.form;
    this.controlFormValue.set(formValue);
    this.form.setValue({
      name: formValue.name,
      controlType: formValue.type ?? '',
      frequency: formValue.frequency ?? '',
      gpc: formValue.generalProcessCategory ?? '',
      investigationProcess: formValue.investigationProcess ?? '',
      ipc: formValue.ipc ?? '',
      judgementComplexityInvolved: formValue.judgement ?? '',
      objective: formValue.objective ?? '',
      qualitativeThresholds: formValue.qualitativeThresholds ?? '',
      quantitativeThresholds: formValue.quantitativeThesholds ?? '',
    });
  }

  private formViewModelToModel(): ControlSchemaV1['value']['form'] {
    const formValue = this.form.getRawValue();
    const patch: ControlSchemaV1['value']['form'] = {
      name: formValue.name,
      qualitativeThresholds: formValue.qualitativeThresholds,
      quantitativeThesholds: formValue.quantitativeThresholds,
      ipc: formValue.ipc,
      judgement: formValue.judgementComplexityInvolved,
      frequency: formValue.frequency,
      generalProcessCategory: formValue.gpc,
      investigationProcess: formValue.investigationProcess,
      objective: formValue.objective,
      type: formValue.controlType,
    };
    return patch;
  }

  private async saveForm() {
    const patch = this.formViewModelToModel();
    this.isSaving.set(true);
    await firstValueFrom(this.controlsService.patchControlForm(this.controlId(), patch));
    this.isSaving.set(false);
  }

  async exportToPdf() {
    const control = this.controlFormValue();

    if (!control?.name) {
      this.snackbar.open('Please enter a name for the control', 'Dismiss', { duration: 3000, verticalPosition: 'top', panelClass: 'snackbar-error' });
      return;
    }

    const fileName = control.name.toLowerCase().replace(/\s+/g, '-') + '.pdf';

    const folderPath = await window.ipc?.invoke('select-folder', fileName, 'Export control to PDF', [
      { name: 'PDF', extensions: ['pdf'] },
    ]);
    if (!folderPath) {
      return;
    }
    await firstValueFrom(this.controlsService.exportControlToPdf(this.controlId(), folderPath));
  }
}
