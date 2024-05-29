import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

declare global {
  interface Window {
    ipc?: {
      /** Will always return a promise */
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      /** Returns a callback function to cleanup the event listener */
      on: (channel: string, handler: (...args: any[]) => any) => () => void;
    }
  }
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
