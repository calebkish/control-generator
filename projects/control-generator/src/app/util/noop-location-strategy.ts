import { APP_BASE_HREF, PathLocationStrategy, PlatformLocation } from '@angular/common';
import { Inject, Injectable, OnDestroy, Optional, inject } from '@angular/core';

@Injectable({providedIn: 'root'})
export class NoopLocationStrategy extends PathLocationStrategy implements OnDestroy {
  // private plaformLocationRef: PlatformLocation;

  constructor(
    _platformLocation: PlatformLocation,
    @Optional() @Inject(APP_BASE_HREF) href?: string,
  ) {
    super(_platformLocation, href);
    // this.plaformLocationRef = _platformLocation;
  }

  override pushState(state: any, title: string, url: string, queryParams: string) {
    // console.log('pushState', state, title, url);
    // this.plaformLocationRef.pushState(state, title, '');
  }

  override replaceState(state: any, title: string, url: string, queryParams: string) {
    // console.log('replaceState', state, title, url);
    // this.plaformLocationRef.replaceState(state, title, '');
  }
}
