import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TabsComponent } from './components/tabs/tabs.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';
import { SearchService } from './services/search.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, TabsComponent, ToolbarComponent],
})
export class AppComponent implements OnInit {
  private searchService = inject(SearchService);
  private router = inject(Router);
  private location = inject(Location);
  private authService = inject(AuthService);

  toolbarConfig = {
    showBack: false,
    showSearch: false
  };

  // Ubicación actual del usuario (por defecto Almería)
  currentLocation = { lat: 36.8377, lng: -2.4585 };

  isAuthenticated = false;
  currentRoute = '';

  ngOnInit() {
    // Escuchar cambios de ruta para actualizar la configuración del toolbar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
      this.updateToolbarConfig(event.url);
      
      console.log('AppComponent: Navegación completada a:', event.url);
    });

    // Configuración inicial
    this.currentRoute = this.router.url;
    this.updateToolbarConfig(this.router.url);

    // Intentar obtener la ubicación del usuario
    this.getCurrentLocation();

    // Escuchar cambios en la autenticación SIN interferir con navegación
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      console.log('AppComponent: Auth status changed:', isAuth);
      // NO hacer redirecciones automáticas aquí
    });
  }

  get isUserLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  private updateToolbarConfig(url: string) {
    this.toolbarConfig = {
      showBack: false,
      showSearch: false
    };

    switch (true) {
      case url === '/' || url === '/home':
        this.toolbarConfig = { showBack: false, showSearch: this.isAuthenticated };
        break;
      case url === '/pois' || url.startsWith('/pois'):
        this.toolbarConfig = { showBack: true, showSearch: true };
        break;
      case url === '/profile':
        this.toolbarConfig = { showBack: true, showSearch: true };
        break;
      case url === '/add-poi':
        this.toolbarConfig = { showBack: true, showSearch: false };
        break;
      case url === '/generate-route':
        this.toolbarConfig = { showBack: true, showSearch: false };
        break;
      case url === '/register' || url === '/login':
        this.toolbarConfig = { showBack: true, showSearch: false };
        break;
      case url.startsWith('/poi/'):
        this.toolbarConfig = { showBack: true, showSearch: false };
        break;
      default:
        if (url.includes('/') && url !== '/') {
          this.toolbarConfig = { showBack: true, showSearch: false };
        } else {
          this.toolbarConfig = { showBack: false, showSearch: this.isAuthenticated };
        }
        break;
    }
  }

  get shouldShowTabs(): boolean {
    // Rutas que pueden mostrar tabs
    const tabRoutes = ['/home', '/pois', '/profile', '/add-poi', '/generate-route'];
    const isInTabRoute = tabRoutes.some(route => 
      this.currentRoute === route || 
      (route === '/pois' && this.currentRoute.startsWith('/poi/')) // Incluir detalles de POI
    );
    
    // Mostrar tabs si está autenticado Y en una ruta que soporte tabs
    // O si es una ruta pública que debe mostrar tabs
    const publicTabRoutes = ['/home', '/pois'];
    const isPublicTabRoute = publicTabRoutes.some(route => 
      this.currentRoute === route || 
      (route === '/pois' && this.currentRoute.startsWith('/poi/'))
    );
    
    return (this.isAuthenticated && isInTabRoute) || isPublicTabRoute;
  }

  // Método para obtener el placeholder del searchbar según la página
  getSearchPlaceholder(): string {
    const currentUrl = this.router.url;
    
    if (currentUrl === '/' || currentUrl === '/home') {
      return '¿Qué quieres descubrir?';
    } else if (currentUrl === '/pois' || currentUrl.startsWith('/pois')) {
      return 'Buscar puntos de interés...';
    } else if (currentUrl === '/profile') {
      return 'Buscar en perfil...';
    }
    
    return 'Buscar...';
  }

  onBack() {
    this.location.back();
  }

  onSearchChange(query: string) {
    console.log('Search change (not used):', query);
  }

  onSearchSubmit(query: string) {
    console.log('AppComponent: Búsqueda enviada desde toolbar:', query);
    
    const currentUrl = this.router.url;
    
    // Validar query mínimo
    if (query.trim().length === 0) {
      if (currentUrl.includes('/profile')) {
        // En perfil, limpiar filtros
        this.broadcastSearchToProfile('');
        return;
      } else {
        // En otras vistas, ir a POIs sin filtros
        this.router.navigate(['/pois']);
        return;
      }
    }

    if (query.trim().length < 2) {
      console.log('AppComponent: Búsqueda demasiado corta');
      return;
    }

    // Actualizar ubicación en servicio
    this.searchService.updateSearchLocation(this.currentLocation);
    
    // COMPORTAMIENTO SEGÚN LA VISTA
    if (currentUrl.includes('/profile')) {
      // Búsqueda local en perfil
      console.log('AppComponent: Búsqueda local en perfil');
      this.broadcastSearchToProfile(query.trim());
    } else {
      // Búsqueda global → siempre a poi-list
      this.performGlobalSearch(query.trim());
    }
  }

  private broadcastSearchToProfile(query: string) {

  }

  // Método que realiza la búsqueda usando FoursquareService y datos locales
  private performGlobalSearch(query: string) {
    console.log(`Realizando búsqueda global para: "${query}"`);
    
    // Navegar a POIs con parámetros de búsqueda
    this.router.navigate(['/pois'], {
      queryParams: {
        search: query,
        lat: this.currentLocation.lat,
        lng: this.currentLocation.lng,
        timestamp: Date.now() // Para forzar recarga si es la misma búsqueda
      }
    });
  }

  // Método para obtener la ubicación actual del usuario
  private getCurrentLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('Ubicación actual obtenida:', this.currentLocation);
          
          // Actualizar la ubicación en el servicio de búsqueda
          this.searchService.updateSearchLocation(this.currentLocation);
        },
        (error) => {
          console.warn('No se pudo obtener la ubicación:', error);
          // Mantener ubicación por defecto (Almería)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        }
      );
    } else {
      console.warn('Geolocalización no disponible');
    }
  }

  // Método para actualizar la ubicación manualmente
  updateLocation(location: { lat: number; lng: number }) {
    this.currentLocation = location;
    this.searchService.updateSearchLocation(location);
    console.log('Ubicación actualizada manualmente:', location);
  }

  // Método para limpiar búsqueda
  clearSearch() {
    this.searchService.clearSearch();
    console.log('Búsqueda limpiada');
  }

  // Getters útiles para el componente
  get canSearch(): boolean {
    return this.toolbarConfig.showSearch;
  }

  get isMainPage(): boolean {
    const currentUrl = this.router.url;
    return ['/', '/home', '/pois', '/profile', '/add-poi'].includes(currentUrl);
  }
}