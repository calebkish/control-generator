import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { environment } from '../../environment/environment';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { JsonPipe } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-controls-page',
  standalone: true,
  imports: [
    // JsonPipe,
    RouterOutlet,
    MatButtonModule,
    RouterLink,
  ],
  template: `
    <div>In controls page</div>
    <a mat-button routerLink='form'>Form</a>
    <router-outlet />
    <!-- @if (query.data(); as data) {
      {{ data | json }}
    } -->
  `,
  styles: ``,
})
export class ControlsPageComponent {
  // httpClient = inject(HttpClient);

  // url = environment.apiUrl;

  // query = injectQuery(() => ({
  //   queryKey: ['repoData'],
  //   queryFn: () => lastValueFrom(this.httpClient.get<Response>(`${this.url}/controls`)),
  // }));

  constructor() {
    // this.httpClient.get(`${this.url}/controls`).subscribe(console.log);
  }

}
