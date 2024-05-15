import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environment/environment';
import type { Control, ControlChatResponse, ControlSchemaV1 } from '@http';
import { Observable, Subject, shareReplay, startWith, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HttpControlsService {
  private http = inject(HttpClient);

  fetchControlsRequest$ = new Subject<void>();

  controls$: Observable<Control[]> = this.fetchControlsRequest$.pipe(
    startWith(null),
    switchMap(() => this.getControls()),
    shareReplay(1),
  );

  private getControls(): Observable<Control[]> {
    return this.http.get<Control[]>(`${environment.apiUrl}/controls`);
  }

  createControl(name: string) {
    return this.http.post<{ success: boolean, control: Control }>(
      `${environment.apiUrl}/controls`,
      { name }
    );
  }

  getControl(controlId: number): Observable<Control> {
    return this.http.get<Control>(`${environment.apiUrl}/controls/${controlId}`);
  }

  patchControlForm(
    controlId: number,
    form: Partial<ControlSchemaV1['value']['form']>
  ): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/controls/${controlId}`, form);
  }

  deleteControl(controlId: number) {
    return this.http.delete<void>(`${environment.apiUrl}/controls/${controlId}`);
  }

  putControlChat(controlId: number, type: string) {
    return this.http.put<ControlChatResponse>(`${environment.apiUrl}/controls/${controlId}/chat/${type}`, {});
  }

  postChat(chatId: number, userPrompt: string) {
    return this.http.post(`${environment.apiUrl}/chat/${chatId}/prompt`, {
      userPrompt,
    });
  }

  deleteChatHistory(chatId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/chat/${chatId}/history`);
  }

}
