import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environment/environment';
import { Observable, Subject, concat, exhaustMap, map, merge, of, shareReplay, startWith, switchMap, withLatestFrom } from 'rxjs';
import { ConfigVm, LlmConfigOptionResponse } from '@http';
import { TextStreamService } from './text-stream.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly textStreamService = inject(TextStreamService);

  llmConfigsRefetch$ = new Subject<void>();
  activateConfig$ = new Subject<number>();
  deleteConfig$ = new Subject<number>();

  llmConfigs$: Observable<ConfigVm[]> = this.llmConfigsRefetch$.pipe(
    startWith(null),
    switchMap(() => this.getLlmConfigs()),
    switchMap((init) => {
      return concat(
        of(init),
        merge(
          this.llmConfigsRefetch$.pipe(
            withLatestFrom(this.llmConfigs$),
            exhaustMap(() => this.getLlmConfigs()),
          ),
          this.deleteConfig$.pipe(
            withLatestFrom(this.llmConfigs$),
            exhaustMap(([configIdToDelete, configs]) => {
              return this.deleteConfig(configIdToDelete).pipe(
                map(() => {
                  return configs.filter(c => c.id !== configIdToDelete)
                }),
              );
            }),
          ),
          this.activateConfig$.pipe(
            withLatestFrom(this.llmConfigs$),
            switchMap(([configIdToActivate , configs]) => {
              return this.activateConfig(configIdToActivate).pipe(
                map(() => {
                  configs.forEach((c) => {
                    c.isActive = c.id === configIdToActivate;
                  });
                  return [...configs];
                }),
              );
            }),
          ),
        )
      );
    }),
    shareReplay(1),
  );

  // activeConfig$ = of(null);
  activeConfig$ = this.llmConfigs$.pipe(
    map(configs => configs.find(c => c.isActive) ?? null),
    shareReplay(1),
  );

  private getLlmConfigs() {
    return this.http.get<ConfigVm[]>(`${environment.apiUrl}/configs`);
  }

  getLlmOptions() {
    return this.http.get<LlmConfigOptionResponse[]>(`${environment.apiUrl}/models`)
  }

  downloadFile(option: string) {
    return this.textStreamService.requestTextStream$(`/file/${option}`, {});
  }

  activateConfig(configId: number) {
    return this.http.post<void>(`${environment.apiUrl}/configs/${configId}/activate`, {});
  }

  deleteConfig(configId: number) {
    return this.http.delete<void>(`${environment.apiUrl}/configs/${configId}`);
  }

  addAzureOpenaiConfig(body: {
    apiKey: string,
    endpoint: string,
    option: string,
  }) {
    return this.http.post(`${environment.apiUrl}/configs/azure-openai`, body);
  }
}
