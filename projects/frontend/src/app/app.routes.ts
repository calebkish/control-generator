import { Routes } from '@angular/router';
import { ControlFormPageComponent } from './pages/control-form-page.component';
import { ControlsPageComponent } from './pages/controls-page.component';
import { ControlDescriptionPageComponent } from './pages/control-description-page.component';
import { AttributesRoadmapPageComponent } from './pages/attributes-roadmap-page.component';
import { AttributesPageComponent } from './pages/attributes-page.component';
import { SettingsPageComponent } from './pages/settings-page.component';
import { TranscribePageComponent } from './pages/transcribe-page.component';

export const routes: Routes = [
  {
    path: 'controls',
    component: ControlsPageComponent,
  },
  {
    path: 'controls/form/:controlId',
    component: ControlFormPageComponent,
  },
  {
    path: 'controls/form/:controlId/description',
    component: ControlDescriptionPageComponent,
  },
  {
    path: 'controls/form/:controlId/attributes-roadmap',
    component: AttributesRoadmapPageComponent,
  },
  {
    path: 'controls/form/:controlId/attributes',
    component: AttributesPageComponent,
  },
  {
    path: 'settings',
    component: SettingsPageComponent,
  },
  // {
  //   path: 'transcribe',
  //   component: TranscribePageComponent,
  // }
  {
    path: '**',
    redirectTo: 'controls',
  },
];
