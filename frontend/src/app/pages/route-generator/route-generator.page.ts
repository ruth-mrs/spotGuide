import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonButton, IonItem, IonLabel, IonCheckbox, IonCard, 
  IonCardContent, IonCardHeader, IonCardTitle, IonSpinner, IonText, 
  IonIcon, IonFab, IonFabButton, IonList, IonInput, IonTextarea, 
  IonSelect, IonSelectOption, AlertController, IonSegment, 
  IonSegmentButton, IonChip, IonCardSubtitle
} from '@ionic/angular/standalone';
import { 
  mapOutline, checkmarkCircle, timeOutline, locationOutline, 
  navigateOutline, trashOutline, eyeOutline, shareOutline,
  addOutline, removeOutline, settingsOutline, saveOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';

import { MapComponent } from '../../components/map/map.component';
import { RouteGeneratorService, GeneratedRoute, RouteGenerationRequest } from '../../services/route-generator.service';
import { FavoritesService } from '../../services/favorites.service';
import { CustomPoiService } from '../../services/custom-poi.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-route-generator',
  templateUrl: './route-generator.page.html',
  styleUrls: ['./route-generator.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonButton, IonItem, IonLabel, IonCheckbox, IonCard, 
    IonCardContent, IonCardHeader, IonCardTitle, IonSpinner, IonText, 
    IonIcon, IonFab, IonFabButton, IonList, IonInput, IonTextarea, 
    IonSelect, IonSelectOption, IonSegment, IonSegmentButton, 
    IonChip, IonCardSubtitle,
    CommonModule, FormsModule, MapComponent
  ]
})
export class RouteGeneratorPage implements OnInit, OnDestroy {
  @ViewChild(MapComponent) mapComponent!: MapComponent;

  // Estados principales
  currentSegment: 'select' | 'configure' | 'saved' = 'select';
  
  // POIs disponibles
  allPois: any[] = [];
  selectedPois: any[] = [];

  // Configuración de ruta
  routeConfig = {
    preferences: '',
    duration: '1 día',
    baseLocation: 'Almería, España'
  };

  // Rutas guardadas
  savedRoutes: GeneratedRoute[] = [];
  selectedRoute: GeneratedRoute | null = null;
  routeMarkers: any[] = [];

  // Estados de carga
  isGenerating = false;
  isLoadingPois = true;

  // Suscripciones
  private subscriptions: Subscription[] = [];

  // Iconos
  icons = {
    map: mapOutline,
    check: checkmarkCircle,
    time: timeOutline,
    location: locationOutline,
    navigate: navigateOutline,
    trash: trashOutline,
    eye: eyeOutline,
    share: shareOutline,
    add: addOutline,
    remove: removeOutline,
    settings: settingsOutline,
    save: saveOutline
  };

  constructor(
    public router: Router,
    private alertController: AlertController,
    private routeService: RouteGeneratorService,
    private favoritesService: FavoritesService,
    private customPoiService: CustomPoiService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    console.log('RouteGeneratorPage: Inicializando...');
    this.loadAllPois();
    this.loadSavedRoutes();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupSubscriptions() {
    // Suscribirse a cambios en el estado de generación
    const generatingSub = this.routeService.isGenerating$.subscribe((isGenerating) => {
      this.isGenerating = isGenerating;
    });

    // Suscribirse a rutas guardadas
    const routesSub = this.routeService.savedRoutes$.subscribe((routes) => {
      this.savedRoutes = routes;
    });

    this.subscriptions.push(generatingSub, routesSub);
  }

  getSourceLabel(source: string): string {
  const labels: { [key: string]: string } = {
    'foursquare-favorite': 'Tu favorito',
    'user-custom': 'Tu POI',
    'public-custom': 'POI público'
  };
  return labels[source] || 'POI';
}

  private async loadAllPois() {
  try {
    this.isLoadingPois = true;
    console.log('RouteGeneratorPage: Cargando POIs...');

    // Cargar favoritos de Foursquare
    const foursquareFavorites = await new Promise<any[]>((resolve) => {
      this.favoritesService.getUserFavorites().subscribe({
        next: (favs: any[]) => {
          // Incluir tanto favoritos de Foursquare como de otros orígenes
          console.log('Favoritos cargados:', favs.length);
          resolve(favs);
        },
        error: () => resolve([])
      });
    });

    // Cargar POIs personalizados del usuario
    const userCustomPois = await new Promise<any[]>((resolve) => {
      this.customPoiService.getUserCustomPois().subscribe({
        next: (pois: any[]) => {
          // Solo incluir POIs públicos del usuario actual
          const publicPois = pois.filter((poi: any) => poi.isPublic);
          console.log('POIs personalizados públicos cargados:', publicPois.length);
          resolve(publicPois);
        },
        error: () => resolve([])
      });
    });

    // Por ahora, omitimos los POIs de otros usuarios hasta implementar el método
    // En el futuro se puede añadir getAllCustomPois() al CustomPoiService
    const otherCustomPois: any[] = [];

    // Combinar todos los POIs
    this.allPois = [
      // Favoritos de Foursquare
      ...foursquareFavorites.map(fav => ({ 
        ...fav, 
        source: 'foursquare-favorite', 
        selected: false,
        lat: fav.latitude,
        lng: fav.longitude,
        poiType: 'foursquare'
      })),
      // POIs personalizados del usuario
      ...userCustomPois.map(poi => ({ 
        ...poi, 
        source: 'user-custom', 
        selected: false,
        lat: poi.latitude,
        lng: poi.longitude,
        poiType: 'custom'
      })),
      // POIs personalizados públicos de otros usuarios (pendiente de implementar)
      ...otherCustomPois.map(poi => ({ 
        ...poi, 
        source: 'public-custom', 
        selected: false,
        lat: poi.latitude,
        lng: poi.longitude,
        poiType: 'custom'
      }))
    ];

    console.log(`RouteGeneratorPage: ${this.allPois.length} POIs cargados total`);
    console.log('Desglose:', {
      foursquareFavorites: foursquareFavorites.length,
      userCustom: userCustomPois.length,
      otherCustom: otherCustomPois.length
    });
    
    if (this.allPois.length === 0) {
      await this.toastService.info('No hay POIs disponibles. Agrega algunos favoritos o crea POIs personalizados primero.');
    }

  } catch (error) {
    console.error('Error cargando POIs:', error);
    await this.toastService.error('Error cargando POIs disponibles');
  } finally {
    this.isLoadingPois = false;
  }
}

  private loadSavedRoutes() {
    this.routeService.loadUserRoutes();
  }

  // Cambiar segmento
  onSegmentChange(event: any) {
    this.currentSegment = event.detail.value;
    
    if (this.currentSegment === 'saved') {
      this.loadSavedRoutes();
    }
  }

  // Seleccionar/deseleccionar POI
  togglePoi(poi: any) {
    poi.selected = !poi.selected;
    
    if (poi.selected) {
      this.selectedPois.push(poi);
    } else {
      this.selectedPois = this.selectedPois.filter(p => p.id !== poi.id);
    }

    console.log(`POIs seleccionados: ${this.selectedPois.length}`);
  }

  // Verificar si se puede generar ruta
  canGenerateRoute(): boolean {
    return this.selectedPois.length >= 2 && !this.isGenerating;
  }

  // Generar ruta
  async generateRoute() {
    if (!this.canGenerateRoute()) {
      await this.toastService.warning('Selecciona al menos 2 POIs para generar una ruta');
      return;
    }

    // Validar autenticación
    if (!this.authService.isLoggedIn()) {
      await this.toastService.error('Debes iniciar sesión para generar rutas');
      this.router.navigate(['/login']);
      return;
    }

    try {
      console.log('🗺️ Generando ruta con configuración:', this.routeConfig);

      const request: RouteGenerationRequest = {
        pois: this.selectedPois.map(poi => ({
          id: poi.id,
          name: poi.name,
          category: poi.category,
          description: poi.description,
          latitude: poi.latitude || poi.lat,
          longitude: poi.longitude || poi.lng,
          image: poi.image
        })),
        preferences: this.routeConfig.preferences,
        duration: this.routeConfig.duration,
        baseLocation: this.routeConfig.baseLocation
      };

      const loadingToast = await this.toastService.loading('Generando tu ruta perfecta con IA...');

      const response = await this.routeService.generateRoute(request).toPromise();

      await loadingToast.dismiss();

      if (response?.success) {
        await this.toastService.success(`¡Ruta "${response.route.name}" generada exitosamente! 🗺️`);
        
        // Cambiar a pestaña de rutas guardadas y mostrar la nueva ruta
        this.currentSegment = 'saved';
        this.selectedRoute = response.route;
        this.showRouteOnMap(response.route);
        
        // Limpiar selección
        this.clearSelection();
      }

    } catch (error: any) {
      console.error('Error generando ruta:', error);
      
      let message = 'Error generando la ruta';
      if (error.error?.message) {
        message = error.error.message;
      } else if (error.message) {
        message = error.message;
      }
      
      await this.toastService.error(message);
    }
  }

  // Limpiar selección
  clearSelection() {
    this.allPois.forEach(poi => poi.selected = false);
    this.selectedPois = [];
  }

  // Mostrar ruta en el mapa
  showRouteOnMap(route: GeneratedRoute) {
    this.selectedRoute = route;
    
    this.routeMarkers = route.orderedPois.map((poi, index) => ({
      id: poi.poiId,
      name: `${index + 1}. ${poi.name}`,
      description: poi.notes || poi.name,
      latitude: poi.latitude,
      longitude: poi.longitude,
      category: poi.category,
      image: poi.image,
      isCustom: poi.isCustom || false,
      isFavorite: false,
      distance: '',
      estimatedTime: poi.timeToSpend,
      rating: 0
    }));

    // Centrar mapa en los marcadores si existe el método
    setTimeout(() => {
      if (this.mapComponent && this.routeMarkers.length > 0) {
        // Si el mapa tiene método para mostrar marcadores de ruta, usarlo
        if (typeof (this.mapComponent as any).showRouteMarkers === 'function') {
          (this.mapComponent as any).showRouteMarkers(this.routeMarkers);
        }
        if (typeof (this.mapComponent as any).centerMapOnMarkers === 'function') {
          (this.mapComponent as any).centerMapOnMarkers(this.routeMarkers);
        }
      }
    }, 100);
  }

  // Ver detalles de ruta guardada
  async viewRouteDetails(route: GeneratedRoute) {
    this.selectedRoute = route;
    this.showRouteOnMap(route);

    const alert = await this.alertController.create({
      header: route.name,
      subHeader: `${route.difficulty} • ${route.estimatedTime}`,
      message: `
        <p><strong>Descripción:</strong><br>${route.description}</p>
        <p><strong>Distancia:</strong> ${route.totalDistance}</p>
        <p><strong>POIs:</strong> ${route.orderedPois.length} lugares</p>
        <p><strong>Mejor momento:</strong> ${route.bestTimeToVisit}</p>
        <p><strong>Transporte:</strong> ${route.transportRecommendations}</p>
        ${route.recommendations.length > 0 ? `<p><strong>Recomendaciones:</strong><br>• ${route.recommendations.join('<br>• ')}</p>` : ''}
      `,
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        },
        {
          text: 'Ver en Google Maps',
          handler: () => {
            this.openInGoogleMaps(route);
          }
        }
      ]
    });

    await alert.present();
  }

  // Abrir en Google Maps
  openInGoogleMaps(route: GeneratedRoute) {
    const url = this.routeService.generateGoogleMapsUrl(route);
    if (url) {
      window.open(url, '_blank');
    } else {
      this.toastService.warning('No se pudo generar la URL de Google Maps');
    }
  }

  // Eliminar ruta
  async deleteRoute(route: GeneratedRoute) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que quieres eliminar la ruta "${route.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              const response = await this.routeService.deleteRoute(route._id!).toPromise();
              
              if (response?.success) {
                await this.toastService.success('Ruta eliminada exitosamente');
                
                if (this.selectedRoute?._id === route._id) {
                  this.selectedRoute = null;
                  this.routeMarkers = [];
                }
              }
              
            } catch (error) {
              console.error('Error eliminando ruta:', error);
              await this.toastService.error('Error eliminando la ruta');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Fix para el error de imagen
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/default-poi.jpg';
    }
  }

  // Obtener icono por categoría
  getCategoryIcon(category: string): string {
    const categoryIcons: { [key: string]: string } = {
      restaurant: '🍽️',
      attraction: '🏛️',
      culture: '🎭',
      nature: '🌳',
      shopping: '🛍️',
      hotel: '🏨',
      entertainment: '🎪',
      transport: '🚌',
      health: '🏥',
      education: '🎓',
      sports: '⚽',
      other: '📍'
    };
    
    return categoryIcons[category] || '📍';
  }

  // Obtener color por dificultad
  getDifficultyColor(difficulty: string): string {
    const colors: { [key: string]: string } = {
      'Fácil': 'success',
      'Moderada': 'warning',
      'Difícil': 'danger'
    };
    
    return colors[difficulty] || 'medium';
  }

  getAllPoisAsMarkers(): any[] {
  return this.allPois.map(poi => ({
    id: poi.id,
    position: {
      lat: poi.latitude || poi.lat,
      lng: poi.longitude || poi.lng
    },
    title: poi.name,
    description: poi.description,
    category: poi.category,
    rating: poi.rating || 0,
    distance: poi.distance || '',
    isSelected: poi.selected,
    isCustom: poi.poiType === 'custom'
  }));
}

getSelectedPoisAsMarkers(): any[] {
  return this.selectedPois.map((poi, index) => ({
    id: poi.id,
    position: {
      lat: poi.latitude || poi.lat,
      lng: poi.longitude || poi.lng
    },
    title: `${index + 1}. ${poi.name}`,
    description: poi.description,
    category: poi.category,
    rating: poi.rating || 0,
    distance: '',
    isSelected: true,
    isCustom: poi.poiType === 'custom'
  }));
}

// Calcular centro de POIs seleccionados
getSelectedPoisCenter(): { lat: number; lng: number } {
  if (this.selectedPois.length === 0) {
    return { lat: 36.8377, lng: -2.4585 };
  }

  const latSum = this.selectedPois.reduce((sum, poi) => sum + (poi.latitude || poi.lat), 0);
  const lngSum = this.selectedPois.reduce((sum, poi) => sum + (poi.longitude || poi.lng), 0);

  return {
    lat: latSum / this.selectedPois.length,
    lng: lngSum / this.selectedPois.length
  };
}

// Obtener centro de una ruta
getRouteCenterPoint(route: GeneratedRoute): { lat: number; lng: number } {
  if (route.orderedPois.length === 0) {
    return { lat: 36.8377, lng: -2.4585 };
  }

  const latSum = route.orderedPois.reduce((sum, poi) => sum + poi.latitude, 0);
  const lngSum = route.orderedPois.reduce((sum, poi) => sum + poi.longitude, 0);

  return {
    lat: latSum / route.orderedPois.length,
    lng: lngSum / route.orderedPois.length
  };
}

// Manejar click en marcador del mapa
onMapMarkerClick(marker: any) {
  console.log('Marcador clickeado:', marker);
  const poi = this.allPois.find(p => p.id === marker.id);
  if (poi) {
    this.togglePoi(poi);
  }
}

// Continuar a configuración
continueToConfiguration() {
  if (this.selectedPois.length >= 2) {
    this.currentSegment = 'configure';
  } else {
    this.toastService.warning('Selecciona al menos 2 puntos para continuar');
  }
}

// Remover POI de la selección
removePoi(poi: any) {
  poi.selected = false;
  this.selectedPois = this.selectedPois.filter(p => p.id !== poi.id);
  console.log(`POI ${poi.name} removido. Seleccionados: ${this.selectedPois.length}`);
}

// Ocultar mapa de ruta
hideRouteMap() {
  this.selectedRoute = null;
  this.routeMarkers = [];
}

// Obtener color según el origen del POI
getSourceColor(source: string): string {
  const colors: { [key: string]: string } = {
    'foursquare-favorite': 'primary',
    'user-custom': 'success',
    'public-custom': 'tertiary'
  };
  return colors[source] || 'medium';
}
}