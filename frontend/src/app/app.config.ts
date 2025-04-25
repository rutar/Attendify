import {ApplicationConfig} from '@angular/core';
import {provideRouter, withComponentInputBinding, withInMemoryScrolling} from '@angular/router';
import {routes} from './app.routes';
import {provideHttpClient} from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),
    provideHttpClient(),
  ],
};
