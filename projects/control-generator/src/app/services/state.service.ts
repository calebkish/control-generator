import { Injectable, inject } from '@angular/core';
import { signalSlice } from 'ngxtension/signal-slice';
import { Chat, Control, ControlWithChats } from '@http';
import { Observable, Subject, map, switchMap } from 'rxjs';
import { HttpControlsService } from './http-controls.service';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  httpControlsService = inject(HttpControlsService);
  // loadControls$ = new Subject<void>();

  private initialState: {
    controls: Control[],
    // selectedControl: Control | null,
    // selectedControlChat: Chat | null,
  } = {
    controls: [],
    // selectedControl: null,
    // selectedControlChat: null,
  };

  controlsState = signalSlice({
    initialState: this.initialState,
    // sources: [

    // ],
    actionSources: {
      loadControls: (state, $: Observable<void>) => $.pipe(
        switchMap(() => this.httpControlsService.controls$),
        map((res) => ({ ...state(), controls: res }))
      ),
      // selectControl: (state, $: Observable<number>) => $.pipe(
      //   switchMap((controlId) => this.httpControlsService.getControl(controlId)),
      //   map((res) => ({ ...state(), selectedControl: res })),
      // ),
    },
  });

  // constructor() {
  //   this.controlsState.
  // }


  // getSelectedControlStateMachine(control: Control) {
  //   const initialState: {
  //     control: Control,
  //   } = {
  //     control,
  //   };

  //   const selectedControlState = signalSlice({
  //     initialState,

  //   });

  //   return selectedControlState;
  // }
}
