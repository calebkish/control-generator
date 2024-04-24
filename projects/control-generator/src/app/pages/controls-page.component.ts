import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-controls-page',
  standalone: true,
  imports: [
    // JsonPipe,
    RouterOutlet,
    MatButtonModule,
    RouterLink,
    MatIconModule,
  ],
  template: `
    <h1 class="mat-headline-large">Controls</h1>
    <a mat-button routerLink='form'>
      <mat-icon>add</mat-icon>
      Create a control
    </a>
  `,
})
export class ControlsPageComponent {
  constructor() {
    // this.httpClient.get(`${this.url}/controls`).subscribe(console.log);
  }

}
