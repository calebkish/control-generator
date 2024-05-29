import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { environment } from '../../environment/environment';
import { Subject, firstValueFrom, switchMap } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Loadable, wrap } from '../util/wrap';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-transcribe-page',
  standalone: true,
  imports: [
    MatButton,
    ReactiveFormsModule,
    MatProgressSpinner,
  ],
  template: `
<input type="file" (change)="file$.next($any($event.target).files[0])" />

<div>
  @if (transcription()?.loading) {
    <mat-spinner />
  }
  @if (transcription()?.data; as data) {
    {{ data.text }}
  }
</div>
`,
})
export class TranscribePageComponent {
  private fb = inject(NonNullableFormBuilder);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  file$ = new Subject<File>();

  transcription$ = this.file$.pipe(
    switchMap((file) => {
      const formData = new FormData();
      formData.append('file', file);
      return this.http.post<{ text: string }>(`lol/transcribe`, formData).pipe(
        wrap(),
      );
    }),
    takeUntilDestroyed(),
  );
  transcription = toSignal(this.transcription$);
}
