import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpService, User } from './http.service';
import { TokenService } from './token.service';
import { Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
export { User } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  // Exponer el observable del usuario actual
  public currentUser$ = this.httpService.currentUser$;

  constructor(
    private httpService: HttpService,
    private tokenService: TokenService,
    private router: Router
  ) {
    // Verificar autenticación inicial
    this.checkStoredAuth();
    
    // Escuchar cambios en el usuario actual
    this.httpService.currentUser$.subscribe(user => {
      this.isAuthenticatedSubject.next(!!user);
    });

    // IMPORTANTE: No interferir con la navegación automáticamente
    // Comentar o eliminar cualquier código que redirija automáticamente
  }

  private checkStoredAuth() {
    const isLoggedIn = this.tokenService.hasValidToken();
    this.isAuthenticatedSubject.next(isLoggedIn);
    
    // Verificar token con el servidor si existe
    if (isLoggedIn) {
      this.verifyTokenWithServer();
    }
  }

  private verifyTokenWithServer() {
    this.httpService.verifyToken().pipe(
      catchError(error => {
        console.error('Token verification failed:', error);
        this.logout();
        return of({ valid: false });
      })
    ).subscribe(response => {
      if (!response.valid) {
        this.logout();
      }
    });
  }

  isLoggedIn(): boolean {
    return this.tokenService.hasValidToken();
  }

  getCurrentUser(): User | null {
    return this.httpService.getCurrentUser();
  }

  login(email: string, password: string): Observable<{success: boolean, message: string}> {
    return this.httpService.login({ email, password }).pipe(
      map(response => {
        if (response.success) {
          // Solo redirigir si hay una URL de retorno específica
          const returnUrl = this.getReturnUrl();
          if (returnUrl && returnUrl !== '/poi') { // No redirigir si es una URL de POI genérica
            setTimeout(() => {
              this.router.navigate([returnUrl]);
            }, 1500);
          }
        }
        
        return {
          success: response.success,
          message: response.message
        };
      }),
      catchError(error => {
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  register(userData: any): Observable<{success: boolean, message: string}> {
    return this.httpService.register(userData).pipe(
      map(response => {
        if (response.success) {
          // Solo redirigir si hay una URL de retorno específica
          const returnUrl = this.getReturnUrl();
          if (returnUrl && returnUrl !== '/poi') {
            setTimeout(() => {
              this.router.navigate([returnUrl]);
            }, 1500);
          }
        }
        
        return {
          success: response.success,
          message: response.message
        };
      }),
      catchError(error => {
        return of({
          success: false,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  logout(): void {
    this.httpService.logout().subscribe({
      next: () => {
        console.log('Logout successful');
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Limpiar datos localmente aunque falle el logout en servidor
        this.tokenService.clearAll();
      },
      complete: () => {
        this.isAuthenticatedSubject.next(false);
        // Solo redirigir al home, no interferir con otras navegaciones
        if (this.router.url.includes('/profile') || this.router.url.includes('/add-poi') || this.router.url.includes('/generate-route')) {
          this.router.navigate(['/home']);
        }
      }
    });
  }

  getToken(): string | null {
    return this.tokenService.getToken();
  }

  private getReturnUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('returnUrl');
  }
}