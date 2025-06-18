import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader } from '@ionic/angular/standalone';
import { CustomButtonComponent } from '../../components/custom-button/custom-button.component';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader,
    CommonModule, FormsModule, CustomButtonComponent
  ]
})
export class HomePage implements OnInit, OnDestroy {
  isLoggedIn = false;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Escuchar cambios en la autenticación
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        this.isLoggedIn = isAuth;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateTo(route: string) {
    // Verificar si la ruta requiere autenticación
    const protectedRoutes = ['/add-poi', '/generate-route', '/profile'];
    
    if (!this.isLoggedIn && protectedRoutes.includes(route)) {
      // Redirigir a login para rutas protegidas
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: route }
      });
      return;
    }
    
    // Navegar normalmente para rutas públicas
    this.router.navigate([route]);
  }
}