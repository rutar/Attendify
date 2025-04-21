import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'events',
    loadComponent: () => import('./components/event-list/event-list.component').then(m => m.EventListComponent),
  },
  {
    path: 'events/new',
    loadComponent: () => import('./components/event-create/event-create.component').then(m => m.EventCreateComponent),
  },
  {
    path: 'events/:id',
    loadComponent: () => import('./components/event-detail/event-detail.component').then(m => m.EventDetailComponent),
  },
  {
    path: 'events/:id/participants',
    loadComponent: () => import('./components/participant-list/participant-list.component').then(m => m.ParticipantListComponent),
  },
  {
    path: 'participants/:id',
    loadComponent: () => import('./components/participant-detail/participant-detail.component').then(m => m.ParticipantDetailComponent),
  },
  { path: '', redirectTo: '/events', pathMatch: 'full' },
  { path: '**', loadComponent: () => import('./components/not-found/not-found.component').then(m => m.NotFoundComponent) },
];
