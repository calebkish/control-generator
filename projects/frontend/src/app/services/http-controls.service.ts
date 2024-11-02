import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Control, ControlChatResponse, ControlSchemaV1 } from '@http';
import { Observable, Subject, shareReplay, startWith, switchMap } from 'rxjs';
import { EnvironmentService } from './environment.service';

@Injectable({ providedIn: 'root' })
export class HttpControlsService {
  private http = inject(HttpClient);
  private env = inject(EnvironmentService);

  fetchControlsRequest$ = new Subject<void>();

  controls$: Observable<Control[]> = this.fetchControlsRequest$.pipe(
    startWith(null),
    switchMap(() => this.getControls()),
    shareReplay(1),
  );

  private getControls(): Observable<Control[]> {
    return this.env.withApiUrl$(url => this.http.get<Control[]>(`${url}/controls`));
  }

  createControl(name: string) {
    return this.env.withApiUrl$(url => this.http.post<{ success: boolean, control: Control }>(
      `${url}/controls`,
      { name }
    ));
  }

  getControl(controlId: number): Observable<Control> {
    return this.env.withApiUrl$(url => this.http.get<Control>(`${url}/controls/${controlId}`));
  }

  patchControlForm(
    controlId: number,
    form: Partial<ControlSchemaV1['value']['form']>
  ): Observable<void> {
    return this.env.withApiUrl$(url => this.http.patch<void>(`${url}/controls/${controlId}`, form));
  }

  deleteControl(controlId: number) {
    return this.env.withApiUrl$(url => this.http.delete<void>(`${url}/controls/${controlId}`));
  }

  putControlChat(controlId: number, type: string) {
    return this.env.withApiUrl$(url => this.http.put<ControlChatResponse>(`${url}/controls/${controlId}/chat/${type}`, {}));
  }

  postChat(chatId: number, userPrompt: string) {
    return this.env.withApiUrl$(url => this.http.post(`${url}/chat/${chatId}/prompt`, {
      userPrompt,
    }));
  }

  deleteChatHistory(chatId: number): Observable<void> {
    return this.env.withApiUrl$(url => this.http.delete<void>(`${url}/chat/${chatId}/history`));
  }

  exportControlToPdf(controlId: number, path: string) {
    return this.env.withApiUrl$(url => this.http.post<void>(
      `${url}/controls/${controlId}/export`,
      { path }
    ));
  }

}
