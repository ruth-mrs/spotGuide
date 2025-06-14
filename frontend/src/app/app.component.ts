import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TabsComponent } from './components/tabs/tabs.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';
import { SearchService } from './services/search.service';

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

  toolbarConfig = {
    showBack: false,
    showSearch: false
  };

  // Ubicación actual del usuario (por defecto Almería)
  currentLocation = { lat: 36.8377, lng: -2.4585 };

  ngOnInit() {
    // Escuchar cambios de ruta para actualizar la configuración del toolbar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateToolbarConfig(event.url);
    });

    // Configuración inicial
    this.updateToolbarConfig(this.router.url);

    // Intentar obtener la ubicación del usuario
    this.getCurrentLocation();
  }

  private updateToolbarConfig(url: string) {
    // Resetear configuración por defecto
    this.toolbarConfig = {
      showBack: false,
      showSearch: false
    };

    // Configurar según la ruta
    switch (true) {
      case url === '/' || url === '/home':
        this.toolbarConfig = { showBack: false, showSearch: true };
        break;
      case url === '/pois' || url.startsWith('/pois'):
        this.toolbarConfig = { showBack: false, showSearch: true };
        break;
      case url === '/profile':
        this.toolbarConfig = { showBack: false, showSearch: false }; // Profile sin búsqueda
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
        // Detalle de POI específico
        this.toolbarConfig = { showBack: true, showSearch: false };
        break;
      default:
        // Para otras rutas secundarias
        if (url.includes('/') && url !== '/') {
          this.toolbarConfig = { showBack: true, showSearch: false };
        } else {
          this.toolbarConfig = { showBack: false, showSearch: true };
        }
        break;
    }
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

  // Método para manejar cambios en el searchbar (NO se usa para búsqueda global)
  onSearchChange(query: string) {
    // Este método está disponible pero no se usa para la búsqueda global
    // Se mantiene para compatibilidad futura si se necesita búsqueda en tiempo real
    console.log('Search change (not used):', query);
  }

  // Método principal que ejecuta la búsqueda SOLO cuando se envía (Enter o botón)
  onSearchSubmit(query: string) {
    console.log('Búsqueda enviada desde toolbar:', query);
    
    // Validar que el query tenga contenido mínimo
    if (query.trim().length === 0) {
      // Si está vacío, navegar a POIs sin filtros
      this.router.navigate(['/pois']);
      return;
    }

    if (query.trim().length < 2) {
      console.log('Búsqueda demasiado corta, se requieren al menos 2 caracteres');
      return;
    }

    // Actualizar la ubicación en el servicio de búsqueda
    this.searchService.updateSearchLocation(this.currentLocation);
    
    // Ejecutar búsqueda global que siempre redirige a /pois con los resultados
    this.performGlobalSearch(query.trim());
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

  get currentRoute(): string {
    return this.router.url;
  }
}