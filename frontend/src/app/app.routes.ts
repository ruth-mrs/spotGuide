import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/home',
    pathMatch: 'full'
  },
  { 
    path: 'home', 
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
    canActivate: [GuestGuard]
  },
  { 
    path: 'register', 
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage),
    canActivate: [GuestGuard]
  },
  { 
    path: 'pois', 
    loadComponent: () => import('./pages/poi-list/poi-list.page').then(m => m.PoiListPage)
    // COMPLETAMENTE LIBRE - Sin guards
  },
  { 
    path: 'poi/:id', 
    loadComponent: () => import('./pages/poi-detail/poi-detail.page').then(m => m.PoiDetailPage)
    // COMPLETAMENTE LIBRE - Sin guards
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
    canActivate: [AuthGuard]
  },
  { 
    path: 'add-poi', 
    loadComponent: () => import('./pages/add-poi/add-poi.page').then(m => m.AddPoiPage),
    canActivate: [AuthGuard]
  },
  { 
    path: 'generate-route', 
    loadComponent: () => import('./pages/route-generator/route-generator.page').then(m => m.RouteGeneratorPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'edit-profile',
    loadComponent: () => import('./pages/edit-profile/edit-profile.page').then( m => m.EditProfilePage),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];