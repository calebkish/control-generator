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
    <div class="p-6 bg-violet-50 h-full">
      <div class="font-bold text-lg text-violet-900">Tips and Tricks</div>

      <ul class="list-disc list-outside p-3 flex flex-col gap-2">
        <ng-content select=[items] />
        <!-- <li>
          Write in the same professional manner you would to a reasonably competent coworker not familiar with the control. This could mean spelling out acronyms or describing niche topics.
        </li>
        <li>
          When making multiple points in a section (e.g. multiple pieces of IPC), use bullet points or numbers to differentiate between them. The AI Controller reads in the same manner as we do, so clearly splitting out information greatly helps comprehension.
        </li>
        <li>
          ITDM controls by nature have IPC. Think of what reports the user creates from scratch or generates from a system in order to perform control procedures.
        </li>
        <li>
          Controls that require professional judgement/thresholds/investigation may require more information to get accurate attributes. You can be brief here and always provide more information in the Detailed Description step. In that step, the AI Controller will ask clarifying questions for a better understanding if needed.
        </li>
        <li>
          Each part of the form contains descriptive information and examples. Read each section to help you answer accurately and concisely.
        </li> -->
      </ul>
    </div>
  </mat-drawer>
</mat-drawer-container>
  `
})
export class TipsAndTricksSidenavComponent {
  isTipsOpen = signal(false);
}
