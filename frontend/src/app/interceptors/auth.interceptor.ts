import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('AuthInterceptor: Interceptando petición a:', req.url);
    
    // Solo interceptar peticiones HTTP, NO rutas de navegación
    if (!req.url.startsWith('http')) {
      return next.handle(req);
    }

    // Agregar token a las peticiones si existe
    const token = localStorage.getItem('auth_token');
    
    let authReq = req;
    if (token && !req.url.includes('foursquare')) {
      authReq = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !req.url.includes('foursquare')) {
          console.log('AuthInterceptor: Token inválido, limpiando datos');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          
          // Solo redirigir si estamos en una ruta protegida y NO es una ruta de POI
          const currentUrl = this.router.url;
          const protectedRoutes = ['/profile', '/add-poi', '/generate-route', '/edit-profile'];
          const isProtectedRoute = protectedRoutes.some(route => currentUrl.startsWith(route));
          
          if (isProtectedRoute && !currentUrl.startsWith('/poi/')) {
            console.log('AuthInterceptor: Redirigiendo a login desde ruta protegida');
            this.router.navigate(['/login']);
          }
        }
        return throwError(() => error);
      })
    );
  }
}