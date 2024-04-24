import { Routes } from '@angular/router';
import { FormComponent as ControlFormComponent } from './pages/control-form.component';
import { ControlsPageComponent } from './pages/controls-page.component';

export const routes: Routes = [
  {
    path: 'controls',
    component: ControlsPageComponent,
  },
  {
    path: 'controls/form',
    component: ControlFormComponent,
  },
  // {
  //   path: '**',
  //   redirectTo: 'controls',
  // }
];
