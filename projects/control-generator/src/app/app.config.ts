import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { QueryClient, provideAngularQuery } from '@tanstack/angular-query-experimental';
import { LocationStrategy } from '@angular/common';
import { NoopLocationStrategy } from './util/noop-location-strategy';
import { environment } from '../environment/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      ...(environment.stage === 'development' ? [withHashLocation()] : []),
    ),
    provideHttpClient(),
    provideAnimationsAsync(),
    provideAngularQuery(new QueryClient()),
    ...(environment.stage === 'electron' ? [
      {
        provide: LocationStrategy,
        useClass: NoopLocationStrategy
      }
    ] : [])
  ],
};
