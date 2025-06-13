import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage) },
  { path: 'login', loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage) },
  { path: 'pois', loadComponent: () => import('./pages/poi-list/poi-list.page').then(m => m.PoiListPage) },
  { path: 'poi/:id', loadComponent: () => import('./pages/poi-detail/poi-detail.page').then(m => m.PoiDetailPage) },
  { path: 'profile', loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage) },
  { path: 'add-poi', loadComponent: () => import('./pages/add-poi/add-poi.page').then(m => m.AddPoiPage) },
  { path: 'generate-route', loadComponent: () => import('./pages/route-generator/route-generator.page').then(m => m.RouteGeneratorPage) }
];
