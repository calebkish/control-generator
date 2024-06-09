import { AfterRenderPhase, Component, DestroyRef, ElementRef, Injector, afterNextRender, inject, input, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAnchor, MatButton, MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { EMPTY, Observable, Subject, concat, concatWith, defer, firstValueFrom, map, of, scan, skip, switchMap, takeUntil, tap } from 'rxjs';
import { signalSlice } from 'ngxtension/signal-slice';
import type { ConfigVm, ControlChatResponse, ControlSchemaV1, LlmConfigOptionResponse } from '@http';
import { TextAreaFieldComponent } from '../components/controls/textarea-field.component';
import { SystemPromptDialogComponent, SystemPromptDialogData } from '../components/system-prompt-dialog.component';
import { TextStreamService } from '../services/text-stream.service';
import { HttpControlsService } from '../services/http-controls.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDivider } from '@angular/material/divider';
import { glossary } from '../util/glossary';
import { ArrayFieldComponent } from '../components/controls/array-field.component';
import { SettingsService } from '../services/settings.service';
import { environment } from '../../environment/environment';
import { TipsAndTricksSidenavComponent } from '../components/tips-and-track-sidenav.component';

@Component({
  selector: 'app-attributes-page',
  standalone: true,
  imports: [
    TextAreaFieldComponent,
    MatButton,
    MatIcon,
    MatProgressSpinner,
    RouterLink,
    MatAnchor,
    MatDivider,
    ArrayFieldComponent,
    MatMiniFabButton,
    MatIconButton,
    TipsAndTricksSidenavComponent,
  ],
  templateUrl: './attributes-page.component.html',
  styles: `
.scrolling-element {
  > *:not(.anchor) {
    overflow-anchor: none;
  }

  > .anchor {
    overflow-anchor: auto;
    height: 1px;
  }
}
  `,
})
export class AttributesPageComponent {
  private fb = inject(NonNullableFormBuilder);
  private snackbar = inject(MatSnackBar);
  private controlsService = inject(HttpControlsService);
  private destroyRef = inject(DestroyRef);
  private textStreamService = inject(TextStreamService);
  private dialog = inject(MatDialog);
  private injector = inject(Injector);
  private settingsService = inject(SettingsService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  shouldAllowReadWriteSystemPrompt = environment.stage === 'development';

  private scrollingElement = viewChild.required('scrollingElement', { read: ElementRef<HTMLElement> });
  private userInputField = viewChild.required('userInput', { read: TextAreaFieldComponent });
  private attributeField = viewChild.required<ArrayFieldComponent<string>>(ArrayFieldComponent);

  controlId = input.required<number, string>({ transform: (val) => parseInt(val) });

  form = this.fb.group({
    attributes: this.fb.array<string>([]),
    userInput: this.fb.control<string>('', [Validators.required]),
  });

  formDirty = signal(false);

  initialState: {
    activeConfig: ConfigVm | null,
    chat: ControlChatResponse | null,
    buffer: {
      userPrompt: string,
      modelResponse: string,
    } | null,
  } = {
    activeConfig: null,
    chat: null,
    buffer: null,
  };

  state = signalSlice({
    initialState: this.initialState,
    sources: [
      (state) => this.settingsService.activeConfig$.pipe(
        map(activeConfig => {
          return { ...state(), activeConfig };
        }),
      ),
    ],
    actionSources: {
      onInit: (state, $: Observable<void>) => $.pipe(
        switchMap(() => this.controlsService.putControlChat(this.controlId(), 'attributes')),
        tap((res) => {
          for (const attribute of res.controlForm.attributes ?? []) {
            this.attributeField().add(attribute);
          }

          // Scroll to bottom after history has been rendered
          afterNextRender(() => {
            this.scrollToBottom();
          }, { injector: this.injector, phase: AfterRenderPhase.Read });
        }),
        map((res) => ({ ...state(), chat: res })),
      ),
      critqueRequest: (state, $: Observable<void>) => $.pipe(
        switchMap(() => {
          const chat = state().chat;
          if (!chat) return EMPTY;

          const userPrompt = (() => {
            if ((state().chat?.history ?? []).length === 0) {
              return 'Please generate some attributes';
            }

            if (!this.form.controls.userInput.valid) {
              this.form.controls.userInput.markAllAsTouched();
              this.form.controls.userInput.updateValueAndValidity();
              this.snackbar.open('Please enter something for the prompt', 'Dismiss', { duration: 3000, verticalPosition: 'top', panelClass: 'snackbar-error' });
              this.userInputField().focus();
              return null;
            }

            return this.form.controls.userInput.value;
          })();

          if (userPrompt === null) {
            return EMPTY;
          }

          const systemPrompt = getAttributesAssistSystemPrompt(chat.controlForm);
          if (!systemPrompt.success) {
            this.snackbar.open(systemPrompt.message, 'Dismiss', { duration: 10000, verticalPosition: 'top', panelClass: 'snackbar-error' });
            return EMPTY;
          }

          const activeConfig = state().activeConfig;

          if (!activeConfig) {
            this.snackbar.open('Please select a model to use first in the settings page.', 'Dismiss', { panelClass: 'snackbar-error', duration: 5000 });
            return EMPTY;
          }

          return concat(
            of({
              ...state(),
              buffer: {
                userPrompt: userPrompt,
                modelResponse: '',
              },
            } satisfies typeof this.initialState)
              .pipe(
                tap(() => {
                  // Scroll to bottom when buffer has been rendered.
                  afterNextRender(() => {
                    this.scrollToBottom();
                  }, { injector:  this.injector, phase: AfterRenderPhase.Read });
                }),
              ),

            this.textStreamService.requestTextStream$(
              `/chat/${chat.chatId}/prompt`,
              { userPrompt, systemPrompt: systemPrompt.message, configId: activeConfig.id }
            ).pipe(
              scan((acc, textChunk) => acc + textChunk, ''),
              map((modelResponse) => {
                return {
                  ...state(),
                  buffer: {
                    userPrompt: userPrompt,
                    modelResponse: modelResponse,
                  },
                } satisfies typeof this.initialState;
              }),
              // On finished prompt response, add to chat history from buffer.
              concatWith(
                // Needs to be in a defer so we get the latest state.
                defer(() => {
                  const { chat, buffer } = state();
                  if (chat && buffer) {
                    chat.history = [
                      ...chat.history,
                      {
                        type: 'user',
                        text: buffer.userPrompt,
                      },
                      {
                        type: 'model',
                        response: [buffer.modelResponse],
                      },
                    ];
                  }

                  return of({
                    ...state(),
                    chat: structuredClone(chat),
                  } satisfies typeof this.initialState);
                }),
              ),
              takeUntil(this.cancel$),
            ),

            // Needs to be in a defer so we get the latest state.
            defer(() => of({ ...state(), buffer: null }).pipe(
              tap(() => {
                this.form.controls.userInput.reset();
                afterNextRender(() => {
                  this.scrollToBottom();
                }, { injector:  this.injector, phase: AfterRenderPhase.Read });
              }),
            )),
          );
        }),
      ),
      clearHistory: (state, $: Observable<void>) => $.pipe(
        switchMap(() => {
          const { chat } = state();
          if (!chat) return EMPTY;
          return this.controlsService.deleteChatHistory(chat.chatId).pipe(
            map(() => {
              return {
                ...state(),
                chat: {
                  ...chat,
                  history: [],
                },
              };
            }),
          );
        }),
      ),
      viewSystemPrompt: (state, $: Observable<void>) => $.pipe(
        switchMap(() => {
          const form = state().chat?.controlForm;
          if (!form) {
            return EMPTY;
          }

          const systemPrompt = getAttributesAssistSystemPrompt(form);
          if (!systemPrompt.success) {
            this.snackbar.open(systemPrompt.message, 'Dismiss', { duration: 10000, verticalPosition: 'top', panelClass: 'snackbar-error' });
            return EMPTY;
          }

          return this.dialog.open(SystemPromptDialogComponent, {
            width: '60rem',
            maxWidth: '100%',
            minHeight: '30rem',
            data: {
              systemPrompt: systemPrompt.message,
              mode: 'readonly',
            } satisfies SystemPromptDialogData,
          }).afterClosed().pipe(
            map(() => ({}))
          );
        }),
      ),
    },
    selectors: (state) => ({
      history: () => state.chat()?.history ?? [],
      historyIsEmpty: () => (state.chat()?.history ?? []).length === 0,
    }),
    // effects: (state) => ({
    //   init: () => {
    //     console.log(state());
    //   },
    // }),
  });

  onSubmit$ = new Subject<void>();
  cancel$ = new Subject<void>();

  async ngOnInit() {
    this.state.onInit();

    this.form.valueChanges.pipe(
      skip(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((value) => {
      this.formDirty.set(true);
    });

    // Handle save.
    this.onSubmit$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(async () => {
      const formValue = this.form.getRawValue();

      const patch: Partial<ControlSchemaV1['value']['form']> = {
        attributes: formValue.attributes,
      };

      await firstValueFrom(this.controlsService.patchControlForm(this.controlId(), patch));
      this.snackbar.open('Saved!', 'Dismiss', { duration: 3000, verticalPosition: 'top' });
      this.formDirty.set(false);
    });
  }

  scrollToBottom() {
    this.scrollingElement().nativeElement.scrollTop = this.scrollingElement().nativeElement.scrollHeight;
  }

  goBack() {
    if (this.formDirty()) {
      this.snackbar.open('Please save the attributes first', 'Dismiss', { duration: 3000, verticalPosition: 'top', panelClass: 'snackbar-error' });
      return;
    }
    this.router.navigate(['..'], { relativeTo: this.activatedRoute });
  }
}

const generalAttributes = `
General Attributes:
The following are templates to assist you in writing general design attributes. These are a general guide for how to write these kinds of attributes.

Review Procedures Example:
Attribute A
The [Control Operator] will review the [Document/IPC] (such as an invoice, a sales report, journal entry, or account reconciliations) for completeness and accuracy by performing the following procedures:
- Check the mathematical accuracy of [Document/IPC] by recalculating [specific values/columns]
- Trace output data back to the [source document/schedule/system]
- Review system report parameters ensuring the correct data was pulled.
- Ensure that the transaction is posted to the correct [account/cost center/period/company code/etc].
- Compare [Document/IPC] with the pertinent data in [ERP System]
- The [Control Operator] will evidence performance of these procedures via [highlights/dated initials/formulas] within the document.


Reconciliation Review Example:
Attribute B
On a [frequency] basis, the [Control Operator] will perform reconciliation of [key accounts] by performing the following procedures:
- Agrees the GL balance to the subledger balance
- Compares the subledger balance per reconciliation to the underlying support
- Reviews any reconciling items greater than [quantitative threshold] and ensures appropriate rationale/supporting documentation is retained for any variance identified.
- The [Control Operator] will evidence review via [sign-off/date] within the reconciliation.

Report Review Example:
Attribute C
The [Control Operator] reviews a [system report] extracted from [ERP System] verify the completeness and accuracy by:
- Cross-referencing totals of key financial figures to totals in other reports or system screen-shots
- Reviewing the report input parameters in [ERP System]
- Checking the data against an underlying schedule or source document.
- The [Control Operator] will evidence review by [initials/date/annotations] throughout the workpaper.

Sampling and Testing Example:
Attribute D
The [Control Operator] uses a [random number generator] to generate samples for testing. The sample selection process is documented via [screenshots/selection excel tab/etc]. Each sample is then reviewed by the [Control Operator] against the following criteria to determine if a sample has passed or failed:
- [bullet points for each criteria]

The [Control Operator] will evidence review of each selection and pass/fail status by leaving inspection level evidence in the form of [initials/date/etc.]

Error Resolution Example:
Attribute E
In the event of discrepancies or errors found between crucial documents or data, the [Control Owner] will investigate to determine the nature of error by performing the following:
- Perform inquiry of relevant individuals
- Expand sample testing if the error is determined to be random
- Conducts root cause analysis and determine appropriate resolution if error is systematic
- The [Control Owner] will retain evidence of the resolution process in the form of [emails/supporting schedules/inquiries]
`;

const ipeAttributes = `
IPE Attributes:
The following are templates to assist you in writing IPE design attributes. These are a general guide for how to write these kinds of attributes.

Accuracy and Validation Example:
IPC Attribute A - [Report Name]
The [Control Operator], using the [System/Software Name], runs the [Report Name] with data for the applicable period. The report is then cross-checked against the [Underlying Source Data such as system screenshots] for accuracy, and a comparison of selected key figures is performed. Any discrepancies are investigated and resolved. The [Control Operator] reviews the report, focusing on the accuracy of selected key metrics, and validates that no discrepancies are present. The review is evidenced by annotating with initials, dates, and comments if applicable.

Completeness Example:
IPC Attribute B - [Document/Report Name]
The [Control Operator] runs the [Report Name] in [System/Software Name]. This report is then exported to excel where the [Control Operator] verifies the total row count of the exported report ties to the system and retains a screenshot to evidence this. Report parameters are retained by the Control Operator. Review completion is evidenced by initials and date.

Authorization and Review Example:
IPC Attribute C - [Document/Report Name]
Manual [System] entries are reviewed and approved by [Control Operator] prior to posting to the system. The reviewer ensures that all entries meet the necessary authorization criteria, are supported by adequate documentation and comply with internal policies. The review is documented by the reviewer's initials and dates.

Reconciliation and Comparison Example:
IPC Attribute D - [Report Name]
Upon generation of the [Report Name] by the [Control Operator], the report's total figures are reconciled to the control totals from the [Control Report/System Name]. Both reports should be run using consistent parameters (such as date and scope). Any variances identified are investigated and documented. The [Control Operator] confirms reconciliation accuracy, with the review evidenced by initialing and dating the report.

Parameter Review Example:
IPC Attribute E - [IPC Name]
The [Report Name] generated by [Control Operator] in [System/Software Name] is based on critical parameters, which include [List Parameters]. The [Control Operator] verifies that these parameters are set correctly. The correct setup is evidenced by a screenshot of the parameter settings and a review signature with initials and date.
`;

const judgement = `
Judgement/Complexity:
When judgment is involved in a control attribute, it introduces challenges in elaborating on:
- the subjectivity involved in the control attribute; and
- the 'triggers' embedded in the judgmental element that may lead to the identification and investigation of outliers.

Control activities involving judgment are often used in complex areas with the potential for a higher risk of material misstatement, which may increase the amount of evidence needed to show how the control is designed, implemented and operating. This is particularly true in situations where a third party (such as an external auditor) assesses the effectiveness of the entity’s controls. At the same time, gathering and maintaining more evidence may present additional challenges for a control involving judgment.

Practical Tip:
In the words of the COSO Framework, controls “cannot be performed entirely in the minds of senior management without some documentation of management’s thought process and analyses.” It may be most effective for control operators to retain such documentation concurrently with the performance of a control involving judgment. To do so, the control operator could document their thought process, including how they identified and resolved outliers, or what led them to not identify any outliers.

Because this control contains significant judgement or complexity, it is important that the control operator's thought process is thoroughly documented throughout the attributes with sufficient "inspection level evidence" that can be reviewed by a third party (i.e. external auditor).
`;

const getAttributesAssistSystemPrompt = (f: ControlSchemaV1['value']['form']) => {
  const errorMessage = validateFormForAttributesAssist(f);
  if (errorMessage) {
    return { success: false, message: errorMessage };
  }

  const prompt = `Role:
You are an expert CPA specifically designed to assist in writing internal controls that address the control objective specified. Your objective is to write control attributes based on the information provided.

${glossary}

Task:
Write control attributes using this information as background in addition to specific control details about to be provided. Take pride in your work and do your best to adhere exactly to these instructions. The company's bottom line depends on it.

${generalAttributes}

${f.type === 'itdm' && !!f.ipc ? ipeAttributes : ''}

${!!f.judgement ? judgement : ''}

Here is a guide to follow when writing control attributes. Please write the requested number of attributes from the guide and use the description of each attribute to write your comprehensive control attributes.
${f.attributeRoadmap}

Task:
Write control attributes using the glossary, control form, control description, attribute examples, and guide provided. Be business professional in your responses. Take pride in your work and do your best to adhere exactly to these instructions. The company's bottom line depends on it.

Control Form:
Name: ${f.name}
General Process Category: ${f.generalProcessCategory}
Objective: ${f.objective}
Control type: ${f.type}
${f.type === 'itdm' && !!f.ipc ? `IPC: ${f.ipc}` : ''}
Frequency: ${f.frequency}
${!!f.judgement ? `Judgement/complexity: ${f.judgement}` : ''}
${!!f.quantitativeThesholds ? `Quantitative Thresholds: ${f.quantitativeThesholds}` : ''}
${!!f.qualitativeThresholds ? `Qualitative Thresholds: ${f.qualitativeThresholds}` : ''}
${!!f.investigationProcess ? `Investigation and resolution procedures: ${f.investigationProcess}` : ''}

Control Description:
${f.description}`;

  return {
    success: true,
    message: prompt,
  }
}

export function validateFormForAttributesAssist(
  f: ControlSchemaV1['value']['form']
) {
  const invalidFields: string[] = [];

  if (!f.generalProcessCategory) {
    invalidFields.push('General Process Category');
  }
  if (!f.objective) {
    invalidFields.push('Objective');
  }
  if (!f.type) {
    invalidFields.push('Control Type');
  }
  if (!f.frequency) {
    invalidFields.push('Frequency');
  }
  if (!f.description) {
    invalidFields.push('Description');
  }
  if (!f.attributeRoadmap) {
    invalidFields.push('Attributes roadmap');
  }

  if (invalidFields.length > 0) {
    return `Needed fields: ${invalidFields.join(', ')}`;
  }

  return null;
}
