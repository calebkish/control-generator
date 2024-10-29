import { Component, signal } from '@angular/core';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-tips-and-tricks-sidenav',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatMiniFabButton,
    MatIcon,
  ],
  template: `
<mat-drawer-container class="h-full relative" autosize>
  <div class="absolute top-3 right-3">
    <button mat-mini-fab aria-label="Help" (click)="isTipsOpen.set(!isTipsOpen())">
      <mat-icon>help</mat-icon>
    </button>
  </div>

  <ng-content />

  <mat-drawer #drawer mode="side" [opened]="isTipsOpen()" position="end">
    <div class="p-6 bg-violet-50 h-full overflow-auto flex flex-col">
      <div class="font-bold text-lg text-violet-900">Tips and Tricks</div>

      <ul class="list-disc list-outside p-3 flex flex-col gap-2 overflow-auto">
        <ng-content select=[items] />
      </ul>
    </div>
  </mat-drawer>
</mat-drawer-container>
  `
})
export class TipsAndTricksSidenavComponent {
  isTipsOpen = signal(false);
}
