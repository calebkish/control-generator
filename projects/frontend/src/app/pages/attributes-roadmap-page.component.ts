import { AfterRenderPhase, Component, DestroyRef, ElementRef, Injector, afterNextRender, inject, input, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { EMPTY, Observable, Subject, concat, concatWith, defer, firstValueFrom, map, of, scan, skip, switchMap, takeUntil, tap } from 'rxjs';
import { signalSlice } from 'ngxtension/signal-slice';
import { ConfigVm, ControlChatResponse, ControlSchemaV1, LlmConfigOptionResponse } from '@http';
import { TextAreaFieldComponent } from '../components/controls/textarea-field.component';
import { SystemPromptDialogComponent } from '../components/system-prompt-dialog.component';
import { TextStreamService } from '../services/text-stream.service';
import { HttpControlsService } from '../services/http-controls.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDivider } from '@angular/material/divider';
import { SettingsService } from '../services/settings.service';
import { environment } from '../../environment/environment';
import { TipsAndTricksSidenavComponent } from '../components/tips-and-track-sidenav.component';
import { attributesRoadmapAssistSystemPrompt, getAttributesRoadmapAssistUserPrompt } from '../corpus/attributes-roadmap-assist';

@Component({
  selector: 'app-attributes-roadmap-page',
  standalone: true,
  imports: [
    TextAreaFieldComponent,
    MatButton,
    MatIcon,
    MatProgressSpinner,
    RouterLink,
    MatAnchor,
    MatDivider,
    TipsAndTricksSidenavComponent,
  ],
  templateUrl: './attributes-roadmap-page.component.html',
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
export class AttributesRoadmapPageComponent {
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

  private scrollingElement = viewChild.required('scrollingElement', { read: ElementRef<HTMLElement> });
  private attributesRoadmapField = viewChild.required(TextAreaFieldComponent);

  shouldAllowReadWriteSystemPrompt = environment.stage === 'development';

  controlId = input.required<number, string>({ transform: (val) => parseInt(val) });

  form = this.fb.group({
    attributesRoadmap: this.fb.control<string>('', [Validators.required, Validators.minLength(10)]),
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
        switchMap(() => this.controlsService.putControlChat(this.controlId(), 'attributesRoadmap')),
        tap((res) => {
          this.form.patchValue({ attributesRoadmap: res.controlForm.attributeRoadmap ?? '' });
          // Scroll to bottom after history has been rendered
          afterNextRender(() => {
            this.scrollToBottom();
          }, { injector:  this.injector, phase: AfterRenderPhase.Read });

          let systemPrompt = localStorage.getItem(this.lsSystemPromptKey);
          if (!systemPrompt) {
            systemPrompt = attributesRoadmapAssistSystemPrompt;
            localStorage.setItem(this.lsSystemPromptKey, systemPrompt);
          }
        }),
        map((res) => ({ ...state(), chat: res })),
      ),
      critqueRequest: (state, $: Observable<void>) => $.pipe(
        switchMap(() => {
          const chat = state().chat;
          if (!chat) return EMPTY;

          const userPrompt = getAttributesRoadmapAssistUserPrompt(chat.controlForm);
          if (!userPrompt.success) {
            this.snackbar.open(userPrompt.message, 'Dismiss', { duration: 10000, verticalPosition: 'top', panelClass: 'snackbar-error' });
            return EMPTY;
          }

          let systemPrompt = localStorage.getItem(this.lsSystemPromptKey);
          if (!systemPrompt) {
            systemPrompt = attributesRoadmapAssistSystemPrompt;
            localStorage.setItem(this.lsSystemPromptKey, systemPrompt);
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
                userPrompt: userPrompt.message,
                modelResponse: '',
              },
            } satisfies typeof this.initialState).pipe(
              tap(() => {
                // Scroll to bottom when buffer has been rendered.
                afterNextRender(() => {
                  this.scrollToBottom();
                }, { injector:  this.injector, phase: AfterRenderPhase.Read });
              }),
            ),
            this.textStreamService.requestTextStream$(
              `/chat/${chat.chatId}/prompt`,
              { userPrompt: userPrompt.message, systemPrompt, configId: activeConfig.id }
            ).pipe(
              scan((acc, textChunk) => acc + textChunk, ''),
              map((modelResponse) => {
                return {
                  ...state(),
                  buffer: {
                    userPrompt: userPrompt.message,
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

  private readonly lsSystemPromptKey = 'chat-system-prompt#attributesRoadmap';

  async ngOnInit() {
    this.state.onInit();

    this.form.valueChanges.pipe(
      skip(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.formDirty.set(true);
    });

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

    // Handle save.
    this.onSubmit$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(async () => {
      if (!this.form.valid) {
        this.form.controls.attributesRoadmap.markAsTouched();
        this.form.controls.attributesRoadmap.updateValueAndValidity();
        this.snackbar.open('Attributes roadmap field is not valid', 'Dismiss', { duration: 3000, verticalPosition: 'top', panelClass: 'snackbar-error' });
        this.attributesRoadmapField().focus();
        return;
      }

      const formValue = this.form.getRawValue();

      const patch: Partial<ControlSchemaV1['value']['form']> = {
        attributeRoadmap: formValue.attributesRoadmap,
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
      this.snackbar.open('Please save the attributes roadmap first', 'Dismiss', { duration: 3000, verticalPosition: 'top', panelClass: 'snackbar-error' });
      return;
    }
    this.router.navigate(['..'], { relativeTo: this.activatedRoute });
  }
}
