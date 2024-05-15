import { createAction, createActionGroup, createFeature, props } from '@ngrx/store';
import { createReducer, on } from '@ngrx/store';

import { Injectable } from '@angular/core';
import { ControlWithChats } from '../../../../desktop/src/http-server/models';

export const ControlsActions = createActionGroup({
  source: 'Controls',
  events: {
    'Add Control': props<{ controlId: number }>(),
    'Retrieved Controls List': props<{ controls: ReadonlyArray<any> }>(),
    'Select Control': props<{ controlId: number }>(),
  },
});

export const controlsInitialState: {
  controls: ReadonlyArray<any>,
} = {
  controls: [],
};
export const controlsReducer = createReducer(
  controlsInitialState,
  on(ControlsActions.retrievedControlsList, (_state, { controls }) => ({ controls })),
);

export const selectedControlInitialState: {
  control: ControlWithChats | null,
} = {
  control: null,
};
export const selectedControlFeature = createFeature({
  name: 'selected control',
  reducer: createReducer(
    selectedControlInitialState,
    on(ControlsActions.selectControl, (_state, { controlId }) => _state),
  )
});
