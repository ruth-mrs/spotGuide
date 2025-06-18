import { Component, OnInit, ViewChild, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonButton, IonIcon, IonSelect, IonSelectOption, IonItem, IonLabel, IonSpinner, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/angular/standalone';
import { Subscription, combineLatest, forkJoin } from 'rxjs';

import { CustomButtonComponent } from '../../components/custom-button/custom-button.component';
import { PoiCardComponent, POI } from '../../components/poi-card/poi-card.component';
import { MapComponent, MapMarker } from '../../components/map/map.component';
import { SearchService } from '../../services/search.service';
import { FoursquareService } from '../../services/foursquare.service';
import { PaginatedResponse } from '../../interfaces/search'; 
import { FavoritesService } from '../../services/favorites.service';
import { HttpService } from 'src/app/services/http.service';

@Component({
  selector: 'app-poi-list',
  templateUrl: './poi-list.page.html',
  styleUrls: ['./poi-list.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonSelect, IonSelectOption, IonItem, IonSpinner,
    IonInfiniteScroll, IonInfiniteScrollContent,
    CommonModule, FormsModule,
    CustomButtonComponent, PoiCardComponent, MapComponent
  ]
})
export class PoiListPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchService = inject(SearchService);
  private foursquareService = inject(FoursquareService);
  private cdr = inject(ChangeDetectorRef);
  private favoritesService = inject(FavoritesService); 
  private httpService = inject(HttpService);
  private http = inject(HttpClient);
  
  @ViewChild(MapComponent) mapComponent!: MapComponent;
  
  // Agregar baseUrl
  private baseUrl = 'http://localhost:3000/api';
  
  selectedFilter = 'all';
  isLoading = false;
  isLoadingMore = false;
  isSearchMode = false;
  searchQuery = '';
  
  // Paginación inteligente
  currentPage = 1;
  pageSize = 12;
  totalPois = 0;
  hasMoreData = true;
  maxEmptyPages = 10;
  consecutiveEmptyPages = 0;
  
  currentCenter = { lat: 36.8377, lng: -2.4585 };
  
  pois: POI[] = [];
  filteredPois: POI[] = [];
  mapMarkers: MapMarker[] = [];

  private subscription = new Subscription();

  filterOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'historical', label: 'Histórico' },
    { value: 'nature', label: 'Naturaleza' },
    { value: 'restaurant', label: 'Restaurantes' },
    { value: 'culture', label: 'Cultura' },
    { value: 'shopping', label: 'Compras' },
    { value: 'accommodation', label: 'Alojamiento' }
  ];

  ngOnInit() {
    console.log('PoiListPage: Inicializando...');
    
    this.favoritesService.loadUserFavorites();
  
    // Escuchar cambios en favoritos globalmente
    this.subscription.add(
      this.favoritesService.favorites$.subscribe(favorites => {
        console.log('PoiListPage: Favoritos actualizados globalmente:', favorites.length);
        // Sincronizar estado cuando cambien los favoritos
        if (this.pois.length > 0) {
          this.syncFavoritesState();
        }
      })
    );
  
    this.subscription.add(
      this.route.queryParams.subscribe(params => {
        console.log('PoiListPage: Parámetros recibidos:', params);
        
        // Resetear paginación al cambiar parámetros
        this.resetPagination();
        
        if (params['search']) {
          this.isSearchMode = true;
          this.searchQuery = params['search'];
          
          if (params['lat'] && params['lng']) {
            this.currentCenter = {
              lat: parseFloat(params['lat']),
              lng: parseFloat(params['lng'])
            };
          }
          
          console.log(`PoiListPage: Modo búsqueda activado para "${this.searchQuery}"`);
          this.performSearch();
        } else {
          this.isSearchMode = false;
          this.searchQuery = '';
          console.log('PoiListPage: Modo navegación normal');
          this.loadNearbyPois();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private resetPagination() {
    this.currentPage = 1;
    this.pois = [];
    this.filteredPois = [];
    this.hasMoreData = true;
    this.totalPois = 0;
    this.consecutiveEmptyPages = 0;
    
    // Limpiar cache cuando se inicia una nueva búsqueda
    if (this.isSearchMode) {
      this.foursquareService.clearSearchCache('search', this.searchQuery, this.currentCenter.lat, this.currentCenter.lng);
    } else {
      this.foursquareService.clearSearchCache('nearby', '', this.currentCenter.lat, this.currentCenter.lng);
    }
  }

  private performSearch() {
    this.isLoading = this.currentPage === 1;
    this.isLoadingMore = this.currentPage > 1;
    
    console.log(`PoiListPage: Ejecutando búsqueda para "${this.searchQuery}" - Página ${this.currentPage}`);
    
    this.subscription.add(
      this.searchService.getSearchResults(
        this.searchQuery,
        this.currentCenter.lat,
        this.currentCenter.lng,
        this.currentPage,
        this.pageSize
      ).subscribe({
        next: (response: PaginatedResponse) => {
          console.log(`PoiListPage: Página ${this.currentPage} - ${response.pois.length} resultados`);
          console.log('PoiListPage: Respuesta de búsqueda:', response);
          
          if (this.currentPage === 1) {
            this.pois = response.pois;
          } else {
            const newPois = response.pois.filter((newPoi: POI) => 
              !this.pois.some(existingPoi => existingPoi.id === newPoi.id)
            );
            
            if (newPois.length === 0) {
              this.consecutiveEmptyPages++;
            } else {
              this.consecutiveEmptyPages = 0;
              this.pois = [...this.pois, ...newPois];
            }
          }
          
          this.totalPois = response.total;
          this.hasMoreData = response.hasMore && this.consecutiveEmptyPages < this.maxEmptyPages;
          
          console.log(`PoiListPage: POIs de búsqueda finales: ${this.pois.length}`);
          
          this.syncFavoritesState();
          this.applyFilters();
          this.isLoading = false;
          this.isLoadingMore = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('PoiListPage: Error en la búsqueda:', error);
          this.isLoading = false;
          this.isLoadingMore = false;
          this.pois = [];
          this.applyFilters();
          this.cdr.detectChanges();
        }
      })
    );
  }

   private loadNearbyPois() {
    this.isLoading = this.currentPage === 1;
    this.isLoadingMore = this.currentPage > 1;
    
    console.log(`PoiListPage: Cargando POIs cercanos - Página ${this.currentPage}`);
    
    // TEMPORALMENTE SOLO FOURSQUARE PARA DEBUGGEAR
    this.subscription.add(
      this.searchService.getSearchResults(
        '',
        this.currentCenter.lat,
        this.currentCenter.lng,
        this.currentPage,
        this.pageSize
      ).subscribe({
        next: (response: PaginatedResponse) => {
          console.log(`PoiListPage: Página ${this.currentPage} cercanos - ${response.pois.length} encontrados`);
          console.log('PoiListPage: Respuesta completa:', response);
          
          if (this.currentPage === 1) {
            this.pois = response.pois;
          } else {
            const newPois = response.pois.filter((newPoi: POI) => 
              !this.pois.some(existingPoi => existingPoi.id === newPoi.id)
            );
            
            if (newPois.length === 0) {
              this.consecutiveEmptyPages++;
            } else {
              this.consecutiveEmptyPages = 0;
              this.pois = [...this.pois, ...newPois];
            }
          }
          
          this.totalPois = response.total;
          this.hasMoreData = response.hasMore && this.consecutiveEmptyPages < this.maxEmptyPages;
          
          console.log(`PoiListPage: POIs finales: ${this.pois.length}`);
          
          this.syncFavoritesState();
          this.applyFilters();
          this.isLoading = false;
          this.isLoadingMore = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('PoiListPage: Error cargando POIs cercanos:', error);
          this.isLoading = false;
          this.isLoadingMore = false;
          this.cdr.detectChanges();
        }
      })
    );
  }

  private filterCustomPoisByDistance(customPois: POI[]): POI[] {
    // Filtrar Custom POIs por distancia (ejemplo: 5km)
    const maxDistance = 5000; // 5km en metros
    
    return customPois.filter(poi => {
      if (!poi.latitude || !poi.longitude) return false;
      
      const distance = this.calculateDistanceInMeters(
        this.currentCenter.lat,
        this.currentCenter.lng,
        poi.latitude,
        poi.longitude
      );
      
      return distance <= maxDistance;
    });
  }

  private removeDuplicatePois(pois: POI[]): POI[] {
    const seen = new Set();
    return pois.filter(poi => {
      const key = `${poi.id}-${poi.name}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private loadFoursquareOnly() {
    this.subscription.add(
      this.searchService.getSearchResults(
        '',
        this.currentCenter.lat,
        this.currentCenter.lng,
        this.currentPage,
        this.pageSize
      ).subscribe({
        next: (response: PaginatedResponse) => {
          this.pois = response.pois;
          this.totalPois = response.total;
          this.hasMoreData = response.hasMore;
          
          this.syncFavoritesState();
          this.applyFilters();
          this.isLoading = false;
          this.isLoadingMore = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('PoiListPage: Error cargando Foursquare:', error);
          this.isLoading = false;
          this.isLoadingMore = false;
          this.cdr.detectChanges();
        }
      })
    );
  }

  private calculateDistanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // CORREGIR MÉTODO calculateDistance PARA QUE DEVUELVA number EN METROS
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): string {
    const distanceInMeters = this.calculateDistanceInMeters(lat1, lng1, lat2, lng2);
    
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private calculateWalkingTime(poiLat: number, poiLng: number): string {
    const distanceKm = this.calculateDistanceKm(
      this.currentCenter.lat,
      this.currentCenter.lng,
      poiLat,
      poiLng
    );
    
    const walkingSpeedKmh = 5; // 5 km/h velocidad promedio caminando
    const timeHours = distanceKm / walkingSpeedKmh;
    const totalMinutes = Math.round(timeHours * 60);
    
    if (totalMinutes < 1) {
      return '< 1 min';
    } else if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (minutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${minutes}min`;
      }
    }
  }

  private calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private infiniteScrollTimeout: any;
  loadMorePois(event: any) {
    console.log('PoiListPage: loadMorePois llamado');
    console.log('Estado inicial:', {
      hasMoreData: this.hasMoreData,
      isLoadingMore: this.isLoadingMore,
      currentPage: this.currentPage,
      poisActuales: this.pois.length,
      totalPois: this.totalPois
    });
    
    // Condiciones de parada
    if (!this.hasMoreData || this.isLoadingMore) {
      console.log('PoiListPage: Parando - hasMoreData:', this.hasMoreData, 'isLoadingMore:', this.isLoadingMore);
      event.target.complete();
      return;
    }

    // Verificar si ya tenemos suficientes POIs
    if (this.pois.length >= this.totalPois && this.totalPois > 0) {
      console.log(`PoiListPage: Todos los POIs cargados (${this.pois.length}/${this.totalPois})`);
      this.hasMoreData = false;
      event.target.complete();
      event.target.disabled = true;
      return;
    }

    this.isLoadingMore = true;
    this.currentPage++;
    
    console.log(`PoiListPage: Cargando página ${this.currentPage} con pageSize ${this.pageSize}`);

    const searchObservable = this.isSearchMode
      ? this.searchService.getSearchResults(
          this.searchQuery,
          this.currentCenter.lat,
          this.currentCenter.lng,
          this.currentPage,
          this.pageSize
        )
      : this.searchService.getSearchResults(
          '',
          this.currentCenter.lat,
          this.currentCenter.lng,
          this.currentPage,
          this.pageSize
        );

    this.subscription.add(
      searchObservable.subscribe({
        next: (response: PaginatedResponse) => {
          console.log(`PoiListPage: Respuesta página ${this.currentPage}:`, {
            poisRecibidos: response.pois.length,
            totalDisponible: response.total,
            hasMore: response.hasMore
          });

          if (response.pois.length > 0) {
            const existingIds = new Set(this.pois.map(p => p.id));
            const newPois = response.pois.filter((poi: POI) => !existingIds.has(poi.id));
            
            if (newPois.length > 0) {
              this.pois = [...this.pois, ...newPois];
              console.log(`PoiListPage: ${newPois.length} POIs únicos añadidos. Total: ${this.pois.length}`);
              this.consecutiveEmptyPages = 0;
              
              // AÑADIR SINCRONIZACIÓN DE FAVORITOS
              this.syncFavoritesState();
            } else {
              this.consecutiveEmptyPages++;
            }
          } else {
            this.consecutiveEmptyPages++;
          }

          this.totalPois = response.total;
          this.hasMoreData = response.hasMore && this.consecutiveEmptyPages < this.maxEmptyPages;

          this.applyFilters();
          this.isLoadingMore = false;
          this.cdr.detectChanges();
          event.target.complete();

          if (!this.hasMoreData) {
            event.target.disabled = true;
          }
        },
        error: (error) => {
          console.error('PoiListPage: Error en loadMorePois:', error);
          this.isLoadingMore = false;
          this.cdr.detectChanges();
          event.target.complete();
        }
      })
    );
  }

  onFilterChange() {
    console.log(`PoiListPage: Filtro cambiado a "${this.selectedFilter}"`);
    this.applyFilters();
  }

  onAddPoints() {
    console.log('PoiListPage: Añadir puntos clickeado');
    this.router.navigate(['/add-poi']);
  }

  onPoiCardClick(poi: POI) {
    console.log('PoiListPage: POI card clickeado (para mapa):', poi.name);  
    
    // Solo actualizar el mapa, NO navegar a detalles
    this.currentCenter = { lat: poi.latitude, lng: poi.longitude };
    this.updateMapMarkers(poi.id);
    
    if (this.mapComponent) {
      this.mapComponent.centerMap(poi.latitude, poi.longitude, 15);
    }
  }

  onViewDetails(poi: POI) {
    console.log('PoiListPage: Ver detalles clickeado:', poi.name);
    console.log('PoiListPage: Navegando a:', `/poi/${poi.id}`);
    
    this.router.navigateByUrl(`/poi/${poi.id}`, { 
      skipLocationChange: false,
      replaceUrl: false 
    }).then(success => {
      console.log('PoiListPage: Navegación exitosa:', success);
    }).catch(error => {
      console.error('PoiListPage: Error navegando:', error);
    });
  }

  onFavoriteToggle(poi: POI) {
    console.log('=== POI LIST: TOGGLE FAVORITO ===');
    console.log('PoiListPage: Toggle favorito para:', poi.name, 'ID:', poi.id);
    console.log('PoiListPage: Estado actual:', poi.isFavorite);

    // Encontrar el POI en el array principal
    const mainIndex = this.pois.findIndex(p => p.id === poi.id);
    // Encontrar el POI en el array filtrado
    const filteredIndex = this.filteredPois.findIndex(p => p.id === poi.id);
    
    if (mainIndex === -1) {
      console.error('PoiListPage: POI no encontrado en el array principal');
      return;
    }

    // Actualización optimista - cambiar inmediatamente en ambos arrays
    const previousState = this.pois[mainIndex].isFavorite;
    this.pois[mainIndex].isFavorite = !previousState;
    
    if (filteredIndex !== -1) {
      this.filteredPois[filteredIndex].isFavorite = !previousState;
    }
    
    console.log('PoiListPage: Actualización optimista - Nuevo estado UI:', this.pois[mainIndex].isFavorite);

    // Preparar datos del POI para el servicio
    const poiData = {
      id: poi.id,
      name: poi.name,
      description: poi.description,
      image: poi.image,
      category: poi.category,
      latitude: poi.latitude,
      longitude: poi.longitude,
      rating: poi.rating,
      isCustom: 'isCustom' in poi ? (poi as any).isCustom : false
    };

    console.log('PoiListPage: Enviando datos al FavoritesService:', poiData);

    // Llamar al servicio para persistir en backend
    this.subscription.add(
      this.favoritesService.toggleFavorite(poiData).subscribe({
        next: (result) => {
          console.log('PoiListPage: Resultado del servicio:', result);
          
          if (result.success) {
            // Confirmar el estado desde el servidor en ambos arrays
            this.pois[mainIndex].isFavorite = result.isFavorite;
            if (filteredIndex !== -1) {
              this.filteredPois[filteredIndex].isFavorite = result.isFavorite;
            }
            
            console.log('PoiListPage: ✅ Estado confirmado desde servidor:', result.isFavorite);
            
            // Actualizar marcadores del mapa
            this.updateMapMarkers();
            
          } else {
            // Si falla, revertir el cambio optimista en ambos arrays
            this.pois[mainIndex].isFavorite = previousState;
            if (filteredIndex !== -1) {
              this.filteredPois[filteredIndex].isFavorite = previousState;
            }
            console.log('PoiListPage: ↩️ Revirtiendo cambio optimista debido a error');
          }
          
          this.cdr.detectChanges();
        },
        error: (error) => {
          // Si hay error, revertir el cambio optimista en ambos arrays
          this.pois[mainIndex].isFavorite = previousState;
          if (filteredIndex !== -1) {
            this.filteredPois[filteredIndex].isFavorite = previousState;
          }
          console.error('PoiListPage: 💥 Error en toggle, revirtiendo:', error);
          this.cdr.detectChanges();
        }
      })
    );
  }

  onMapClick(coordinates: { lat: number; lng: number }) {
    console.log('PoiListPage: Click en mapa:', coordinates);
  }

  onMapMarkerClick(marker: MapMarker) {
    console.log('PoiListPage: Marcador del mapa clickeado para ver detalles:', marker.title);
    
    // Buscar el POI correspondiente
    const poi = this.pois.find(p => p.id === marker.id);
    if (poi) {
      console.log('PoiListPage: Navegando a detalles del POI desde mapa:', poi.name);
      
      // Usar navigateByUrl
      this.router.navigateByUrl(`/poi/${poi.id}`, { 
        skipLocationChange: false,
        replaceUrl: false 
      }).then(success => {
        console.log('PoiListPage: Navegación desde mapa exitosa:', success);
      }).catch(error => {
        console.error('PoiListPage: Error navegando desde mapa:', error);
      });
    } else {
      console.error('PoiListPage: No se encontró el POI con id:', marker.id);
    }
  }

  fitAllPois() {
    if (this.mapComponent && this.filteredPois.length > 0) {
      console.log('PoiListPage: Ajustando vista del mapa a todos los POIs');
      this.mapComponent.fitBounds();
    }
  }

  private applyFilters() {
    console.log(`PoiListPage: Aplicando filtros. POIs totales: ${this.pois.length}, Filtro: ${this.selectedFilter}`);
    
    let filtered = [...this.pois];

    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(poi => 
        poi.category.toLowerCase() === this.selectedFilter.toLowerCase()
      );
    }

    // Validar que todos los POIs tengan las propiedades requeridas
    filtered = filtered.filter(poi => 
      poi && 
      poi.id && 
      poi.name && 
      typeof poi.latitude === 'number' && 
      typeof poi.longitude === 'number' &&
      !isNaN(poi.latitude) && 
      !isNaN(poi.longitude)
    );

    this.filteredPois = filtered;
    this.updateMapMarkers();
    
    console.log(`PoiListPage: Filtros aplicados, ${this.filteredPois.length} POIs mostrados de ${this.totalPois} total`);
    
    // FORZAR DETECCIÓN DE CAMBIOS
    this.cdr.detectChanges();
  }

  private updateMapMarkers(selectedId?: string) {
    // Filtrar POIs con coordenadas válidas
    const validPois = this.filteredPois.filter(poi => 
      poi.latitude !== undefined && 
      poi.longitude !== undefined && 
      !isNaN(poi.latitude) && 
      !isNaN(poi.longitude) &&
      poi.latitude !== 0 && 
      poi.longitude !== 0
    );

    console.log(`PoiListPage: Creando marcadores para ${validPois.length} POIs con coordenadas válidas de ${this.filteredPois.length} totales`);

    this.mapMarkers = validPois.map(poi => ({
      id: poi.id,
      position: { lat: poi.latitude, lng: poi.longitude },
      title: poi.name,
      description: poi.description,
      category: poi.category,
      rating: poi.rating,
      distance: poi.distance,
      isSelected: selectedId === poi.id,
      isFavorite: poi.isFavorite, // AÑADIR ESTADO DE FAVORITO
      isCustom: 'isCustom' in poi ? (poi as any).isCustom : false
    }));
    
    if (this.mapComponent) {
      this.mapComponent.updateMarkers(this.mapMarkers);
    }
  }

  get searchInfo(): string {
    if (this.isSearchMode && this.searchQuery) {
      return `Resultados para "${this.searchQuery}"`;
    }
    return `Puntos cerca de ti`;
  }

  get canFitBounds(): boolean {
    return this.filteredPois.length > 1;
  }

  get loadingStatusInfo(): string {
    if (this.isLoadingMore && this.consecutiveEmptyPages > 0) {
      return `Buscando en área más amplia... (${this.consecutiveEmptyPages}/${this.maxEmptyPages})`;
    }
    return 'Cargando más puntos...';
  }

  private syncFavoritesState() {
    console.log('PoiListPage: Sincronizando estado de favoritos...');
    console.log('PoiListPage: POIs antes de sincronizar:', this.pois.length);
    
    // Usar el método del FavoritesService para sincronizar
    this.pois = this.favoritesService.syncFavoriteStatus(this.pois);
    
    console.log('PoiListPage: Estado de favoritos sincronizado');
    
    // Actualizar la vista
    this.applyFilters();
    this.updateMapMarkers();
    
    // Forzar detección de cambios
    this.cdr.detectChanges();
  }
}