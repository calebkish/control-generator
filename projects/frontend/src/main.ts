import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

declare global {
  interface Window {
    ipc?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, handler: (...args: any[]) => Promise<any>) => () => void;
      foo: () => any;
    }
  }
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
