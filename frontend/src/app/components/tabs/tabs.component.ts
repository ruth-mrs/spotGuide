import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterLinkActive } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, homeOutline, compass, compassOutline, add, addCircle, addCircleOutline, list, person } from 'ionicons/icons';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    RouterLinkActive
  ],
  styleUrls: ['./tabs.component.scss'],
  standalone: true
})
export class TabsComponent implements OnInit {
  isHomeActive = false;
  isRouteActive = false;
  isAddActive = false;
  isPoisActive = false;
  isProfileActive = false;
  isLoggedIn = false;
  userAvatarUrl = 'https://avatar.iran.liara.run/public';

  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  constructor() {
    addIcons({ 
      home, 
      homeOutline, 
      compass, 
      compassOutline, 
      add, 
      addCircle, 
      addCircleOutline, 
      list, 
      person 
    });
  }

  ngOnInit() { 
    // Escuchar cambios de autenticación
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        this.isLoggedIn = isAuth;
        if (isAuth) {
          this.updateUserAvatar();
        }
      });

    // Escuchar cambios de usuario para actualizar avatar
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.userAvatarUrl = user.avatar || 'assets/avatars/default-avatar.png';
        }
      });

    // Escuchar cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.updateActiveStates(event.url);
    });
    
    // Set initial state
    this.updateActiveStates(this.router.url);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateActiveStates(url: string) {
    this.isHomeActive = url === '/' || url === '/home';
    this.isRouteActive = url === '/generate-route';
    this.isAddActive = url === '/add-poi';
    this.isPoisActive = url === '/pois' || url.startsWith('/poi/');
    this.isProfileActive = url === '/profile' || url === '/edit-profile';
  }

  private updateUserAvatar() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.avatar) {
      this.userAvatarUrl = currentUser.avatar;
    }
  }
}