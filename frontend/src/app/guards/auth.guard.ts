import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    console.log('AuthGuard: Verificando acceso a:', state.url);
    
    // Rutas públicas - permitir siempre sin verificar autenticación
    const publicRoutes = ['/home', '/pois', '/login', '/register'];
    const isPublicRoute = publicRoutes.includes(state.url) || 
                         state.url.startsWith('/poi/');
    
    if (isPublicRoute) {
      console.log('AuthGuard: Ruta pública permitida:', state.url);
      return true;
    }

    return this.authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      console.log('AuthGuard: Usuario autenticado:', isAuthenticated);
      console.log('AuthGuard: Estado actual del usuario:', this.authService.getCurrentUser());
      
      if (isAuthenticated) {
        console.log('AuthGuard: Acceso permitido a:', state.url);
        return true;
      } else {
        console.log('AuthGuard: Redirigiendo a login desde:', state.url);
        this.router.navigate(['/login'], { 
          queryParams: { returnUrl: state.url }
        });
        return false;
      }
    })
  );
  }
}