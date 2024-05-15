import { AfterRenderPhase, Component, DestroyRef, ElementRef, Injector, afterNextRender, inject, input, viewChild } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { EMPTY, Observable, Subject, concat, concatWith, defer, firstValueFrom, map, of, scan, switchMap, takeUntil, tap } from 'rxjs';
import { signalSlice } from 'ngxtension/signal-slice';
import { ControlChatResponse, ControlSchemaV1 } from '@http';
import { TextAreaFieldComponent } from '../components/controls/textarea-field.component';
import { SystemPromptDialogComponent } from '../components/system-prompt-dialog.component';
import { TextStreamService } from '../services/text-stream.service';
import { HttpControlsService } from '../services/http-controls.service';
import { RouterLink } from '@angular/router';
import { MatDivider } from '@angular/material/divider';
import { glossary } from '../util/glossary';

@Component({
  selector: 'app-control-description-page',
  standalone: true,
  imports: [
    TextAreaFieldComponent,
    MatButton,
    MatIcon,
    MatProgressSpinner,
    RouterLink,
    MatAnchor,
    MatDivider,
  ],
  template: `
<div class="flex flex-col gap-6 p-6 h-full">
  <a mat-button [routerLink]="['..']" class="flex-shrink-0 self-start">
    <mat-icon>arrow_back</mat-icon>
    Back to control form
  </a>

  <div class="flex-0 text-2xl font-bold mt-1">Edit Description</div>

  <div class="flex flex-col gap-4 w-full max-w-4xl mx-auto">
    <app-textarea-field
      label="Description"
      [ctrl]="form.controls.description"
    />

    <button mat-flat-button type="button" (click)="onSubmit$.next()" class="flex-shrink-0">
      <mat-icon>save</mat-icon>
      Save Description
    </button>
  </div>

  <mat-divider />

  <div class="flex">
    <button type="button" mat-button (click)="editSystemPrompt$.next()" class="w-full" [disabled]="state.buffer()">
      <mat-icon>edit</mat-icon>
      Edit system prompt
    </button>
    <button type="button" mat-button (click)="state.clearHistory()" class="w-full button-error" [disabled]="state.buffer()">
      <mat-icon>delete_sweep</mat-icon>
      Clear history
    </button>
  </div>

  <div class="scrolling-element overflow-y-auto h-full" #scrollingElement>
    <div class="flex flex-col gap-8">
      @for (historyItem of state.history(); track historyItem) {
        @if (historyItem.type === 'user') {
          <div>
            <div class="font-bold flex items-center gap-2">
              <mat-icon>person</mat-icon>
              You
            </div>
            <div style="white-space: pre-wrap">{{ historyItem.text }}</div>
          </div>
        } @else if (historyItem.type === 'model') {
          <div>
            <div class="font-bold flex items-center gap-2">
              <mat-icon>psychology</mat-icon>
              AI
            </div>
            <div style="white-space: pre-wrap">{{ historyItem.response[0] }}</div>
          </div>
        }
      }
      @if (state.buffer(); as buf) {
        <div>
          <div class="font-bold flex items-center gap-2">
            <mat-icon>person</mat-icon>
            You
          </div>
          <div style="white-space: pre-wrap">{{ buf.userPrompt }}</div>
        </div>
        <div>
          <div class="font-bold flex items-center gap-2">
            <mat-icon>psychology</mat-icon>
            AI
          </div>
          @if (buf.modelResponse.length === 0) {
            <mat-spinner [diameter]="16" />
          } @else {
            <div style="white-space: pre-wrap">{{ buf.modelResponse }}</div>
          }
        </div>
      }
    </div>
    <div class="anchor flex-shrink-0"></div>
  </div>

  @if (state.buffer()) {
    <button type="button" mat-flat-button class="w-full flex-shrink-0 button-error" (click)="cancel$.next()">
      <mat-icon>cancel</mat-icon>
      Cancel
    </button>
  } @else {
    <button type="button" mat-flat-button class="w-full flex-shrink-0" (click)="state.critqueRequest()">
      <mat-icon>emoji_objects</mat-icon>
      Get AI Critique
    </button>
  }
</div>
  `,
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
export class ControlDescriptionPageComponent {
  private fb = inject(NonNullableFormBuilder);
  private snackbar = inject(MatSnackBar);
  private controlsService = inject(HttpControlsService);
  private destroyRef = inject(DestroyRef);
  private textStreamService = inject(TextStreamService);
  private dialog = inject(MatDialog);
  private injector = inject(Injector);

  private scrollingElement = viewChild.required('scrollingElement', { read: ElementRef<HTMLElement> });
  private descriptionField = viewChild.required(TextAreaFieldComponent);

  controlId = input.required<number, string>({ transform: (val) => parseInt(val) });

  form = this.fb.group({
    description: this.fb.control<string>('', [Validators.required, Validators.minLength(10)]),
  });

  initialState: {
    chat: ControlChatResponse | null,
    buffer: {
      userPrompt: string,
      modelResponse: string,
    } | null,
  } = {
    chat: null,
    buffer: null,
  };

  state = signalSlice({
    initialState: this.initialState,
    actionSources: {
      onInit: (state, $: Observable<void>) => $.pipe(
        switchMap(() => this.controlsService.putControlChat(this.controlId(), 'description')),
        tap((res) => {
          this.form.setValue({ description: res.controlForm.description ?? '' });
          // Scroll to bottom after history has been rendered
          afterNextRender(() => {
            this.scrollToBottom();
          }, { injector:  this.injector, phase: AfterRenderPhase.EarlyRead });

          let systemPrompt = localStorage.getItem(this.lsSystemPromptKey);
          if (!systemPrompt) {
            systemPrompt = descriptionAssistSystemPrompt;
            localStorage.setItem(this.lsSystemPromptKey, systemPrompt);
          }
        }),
        map((res) => ({ ...state(), chat: res })),
      ),
      critqueRequest: (state, $: Observable<void>) => $.pipe(
        switchMap(() => {
          const chat = state().chat;
          if (!chat) return EMPTY;

          if (!this.form.controls.description.valid) {
            this.form.controls.description.markAsTouched();
            this.form.controls.description.updateValueAndValidity();
            this.snackbar.open('Description field is not valid', 'Dismiss', { duration: 3000, verticalPosition: 'top', panelClass: 'snackbar-error' });
            this.descriptionField().focus();
            return EMPTY;
          }

          const description = this.form.controls.description.getRawValue();

          const userPrompt = getDescriptionAssistUserPrompt(chat.controlForm, description);
          if (userPrompt === null) {
            this.snackbar.open('Please provide "General Process Category", "Objective", "Control Type", "IPC", and "Frequency" in the control form first.', 'Dismiss', { duration: 10000, verticalPosition: 'top', panelClass: 'snackbar-error' });
            return EMPTY;
          }

          let systemPrompt = localStorage.getItem(this.lsSystemPromptKey);
          if (!systemPrompt) {
            systemPrompt = descriptionAssistSystemPrompt;
            localStorage.setItem(this.lsSystemPromptKey, systemPrompt);
          }

          return concat(
            of({
              ...state(),
              buffer: {
                userPrompt: userPrompt,
                modelResponse: '',
              },
            } satisfies typeof this.initialState).pipe(
              tap(() => {
                // Scroll to bottom when buffer has been rendered.
                afterNextRender(() => {
                  this.scrollToBottom();
                }, { injector:  this.injector, phase: AfterRenderPhase.EarlyRead });
              }),
            ),
            this.textStreamService.requestTextStream$(chat.chatId, userPrompt, systemPrompt).pipe(
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
            defer(() => of({ ...state(), buffer: null })),
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
    },
    selectors: (state) => ({
      history: () => state.chat()?.history ?? [],
    }),
    // effects: (state) => ({
    //   init: () => {
    //     console.log(state());
    //   },
    // }),
  });

  onSubmit$ = new Subject<void>();
  editSystemPrompt$ = new Subject<void>();
  cancel$ = new Subject<void>();

  private readonly lsSystemPromptKey = 'chat-system-prompt#description';

  async ngOnInit() {
    this.state.onInit();

    // Handle editing system prompt.
    this.editSystemPrompt$
      .pipe(
        switchMap(() => {
          return this.dialog.open(SystemPromptDialogComponent, {
            width: '60rem',
            maxWidth: '100%',
            minHeight: '30rem',
            data: {
              systemPrompt: localStorage.getItem(this.lsSystemPromptKey),
            },
          }).afterClosed();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (typeof result === 'string') {
          localStorage.setItem(this.lsSystemPromptKey, result);
        }
      });

    // Handle description save.
    this.onSubmit$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(async () => {
      if (!this.form.valid) {
        this.form.controls.description.markAsTouched();
        this.form.controls.description.updateValueAndValidity();
        this.snackbar.open('Description field is not valid', 'Dismiss', { duration: 3000, verticalPosition: 'top', panelClass: 'snackbar-error' });
        this.descriptionField().focus();
        return;
      }

      const formValue = this.form.getRawValue();

      const patch: Partial<ControlSchemaV1['value']['form']> = {
        description: formValue.description,
      };

      await firstValueFrom(this.controlsService.patchControlForm(this.controlId(), patch));
      this.snackbar.open('Saved!', 'Dismiss', { duration: 3000, verticalPosition: 'top' });
    });
  }

  scrollToBottom() {
    this.scrollingElement().nativeElement.scrollTop = this.scrollingElement().nativeElement.scrollHeight;
  }
}

const descriptionAssistRole = `Role:
You are an expert CPA specifically designed to assist in writing internal controls that address the control objective specified. Your objective is to ensure the background information for a control contains enough detailed information so that an uninformed user can read that information and write design attributes from it.`;

const descriptionAssistTask = `Task:
Write bullet point questions to critique the control description provided until the description is sufficient enough to write control design attributes. Think step by step for all procedures performed to determine if information is missing to write a complete, concise, and accurate control attribute. Keep each question to a single sentence and business professional. Write only the questions and nothing more. Once you believe the description is sufficient, reply with, "No further recommendations. Please proceed to control design step." Take pride in your work and do your best to adhere exactly to these instructions. The company's bottom line depends on it.`;

const descriptionAssistSystemPrompt = `${descriptionAssistRole}

${glossary}

${descriptionAssistTask}`;

const getDescriptionAssistUserPrompt = (
  f: ControlSchemaV1['value']['form'],
  userInput: string
) => {
  if (!f.generalProcessCategory || !f.objective || !f.type || !f.ipc || !f.frequency) {
    return null;
  }

  return `What are some bullet point questions to critique the Control Description below, using the Control Form as context? Once you believe the description is sufficient, reply with, "No further recommendations. Please proceed to control design step."

Control Form:
Name: ${f.name}
General Process Category: ${f.generalProcessCategory}
Objective: ${f.objective}
Control type: ${f.type}
IPC: ${f.ipc}
Frequency: ${f.frequency}
${f.judgement !== undefined ? `Judgement/complexity: ${f.judgement}` : ''}
${f.quantitativeThesholds !== undefined ? `Quantitative Thresholds: ${f.quantitativeThesholds}` : ''}
${f.qualitativeThresholds !== undefined ? `Qualitative Thresholds: ${f.qualitativeThresholds}` : ''}
${f.investigationProcess !== undefined ? `Investigation and resolution procedures: ${f.investigationProcess}` : ''}

Control Description:
${userInput}`;
};
