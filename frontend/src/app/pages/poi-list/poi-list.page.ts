import { Component, OnInit, ViewChild, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonContent, IonButton, IonIcon, IonSelect, IonSelectOption, IonItem, IonLabel, IonSpinner, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';

import { CustomButtonComponent } from '../../components/custom-button/custom-button.component';
import { PoiCardComponent, POI } from '../../components/poi-card/poi-card.component';
import { MapComponent, MapMarker } from '../../components/map/map.component';
import { SearchService } from '../../services/search.service';
import { FoursquareService } from '../../services/foursquare.service';
import { PaginatedResponse } from '../../interfaces/search'; 

// ELIMINAR LA INTERFACE LOCAL PaginatedResponse

@Component({
  selector: 'app-poi-list',
  templateUrl: './poi-list.page.html',
  styleUrls: ['./poi-list.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonButton, IonIcon, IonSelect, IonSelectOption, IonItem, IonLabel, IonSpinner,
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
  
  @ViewChild(MapComponent) mapComponent!: MapComponent;
  
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

  // Resto del código permanece igual...
  ngOnInit() {
    console.log('PoiListPage: Inicializando...');
    
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
          console.log(`PoiListPage: Búsqueda completada, ${response.pois.length} resultados en esta página`);
          console.log('Nuevos POIs recibidos:', response.pois.map((p: POI) => ({ id: p.id, name: p.name })));
          
          if (this.currentPage === 1) {
            this.pois = [...response.pois];
            this.consecutiveEmptyPages = response.pois.length === 0 ? 1 : 0;
            console.log(`PoiListPage: Primera página - ${this.pois.length} POIs cargados`);
          } else {
            // Verificar que no haya duplicados antes de añadir
            const newPois = response.pois.filter((newPoi: POI) => 
              !this.pois.some(existingPoi => existingPoi.id === newPoi.id)
            );
            
            if (newPois.length === 0) {
              this.consecutiveEmptyPages++;
              console.log(`PoiListPage: Página ${this.currentPage} sin POIs nuevos. Páginas vacías consecutivas: ${this.consecutiveEmptyPages}`);
            } else {
              this.consecutiveEmptyPages = 0;
              this.pois = [...this.pois, ...newPois];
              console.log(`PoiListPage: Página ${this.currentPage} - ${newPois.length} POIs nuevos añadidos. Total: ${this.pois.length}`);
            }
          }
          
          this.totalPois = response.total;
          this.hasMoreData = response.hasMore && this.consecutiveEmptyPages < this.maxEmptyPages;
          
          this.applyFilters();
          this.isLoading = false;
          this.isLoadingMore = false;
          
          // FORZAR DETECCIÓN DE CAMBIOS
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('PoiListPage: Error en la búsqueda:', error);
          this.isLoading = false;
          this.isLoadingMore = false;
          if (this.currentPage === 1) {
            this.pois = [];
            this.applyFilters();
          }
          this.cdr.detectChanges();
        }
      })
    );
  }

  private loadNearbyPois() {
    this.isLoading = this.currentPage === 1;
    this.isLoadingMore = this.currentPage > 1;
    
    console.log(`PoiListPage: Cargando POIs cercanos - Página ${this.currentPage}`);
    
    this.subscription.add(
      this.searchService.getSearchResults(
        '',
        this.currentCenter.lat,
        this.currentCenter.lng,
        this.currentPage,
        this.pageSize
      ).subscribe({
        next: (response: PaginatedResponse) => {
          console.log(`PoiListPage: POIs cercanos cargados, ${response.pois.length} encontrados en esta página`);
          console.log('Nuevos POIs cercanos recibidos:', response.pois.map((p: POI) => ({ id: p.id, name: p.name })));
          
          if (this.currentPage === 1) {
            this.pois = [...response.pois];
            this.consecutiveEmptyPages = response.pois.length === 0 ? 1 : 0;
            console.log(`PoiListPage: Primera página cercanos - ${this.pois.length} POIs cargados`);
          } else {
            // Verificar que no haya duplicados antes de añadir
            const newPois = response.pois.filter((newPoi: POI) => 
              !this.pois.some(existingPoi => existingPoi.id === newPoi.id)
            );
            
            if (newPois.length === 0) {
              this.consecutiveEmptyPages++;
              console.log(`PoiListPage: Página ${this.currentPage} sin POIs nuevos. Páginas vacías consecutivas: ${this.consecutiveEmptyPages}`);
            } else {
              this.consecutiveEmptyPages = 0;
              this.pois = [...this.pois, ...newPois];
              console.log(`PoiListPage: Página ${this.currentPage} cercanos - ${newPois.length} POIs nuevos añadidos. Total: ${this.pois.length}`);
            }
          }
          
          this.totalPois = response.total;
          this.hasMoreData = response.hasMore && this.consecutiveEmptyPages < this.maxEmptyPages;
          
          this.applyFilters();
          this.isLoading = false;
          this.isLoadingMore = false;
          
          // FORZAR DETECCIÓN DE CAMBIOS
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('PoiListPage: Error cargando POIs cercanos:', error);
          this.isLoading = false;
          this.isLoadingMore = false;
          if (this.currentPage === 1) {
            this.pois = [];
            this.applyFilters();
          }
          this.cdr.detectChanges();
        }
      })
    );
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
            // Filtrar duplicados
            const existingIds = new Set(this.pois.map(p => p.id));
            const newPois = response.pois.filter((poi: POI) => !existingIds.has(poi.id));
            
            if (newPois.length > 0) {
              this.pois = [...this.pois, ...newPois];
              console.log(`PoiListPage: ${newPois.length} POIs únicos añadidos. Total: ${this.pois.length}`);
              this.consecutiveEmptyPages = 0;
              this.applyFilters();
            } else {
              this.consecutiveEmptyPages++;
              console.log(`PoiListPage: Sin POIs únicos. Páginas vacías: ${this.consecutiveEmptyPages}`);
            }
          } else {
            this.consecutiveEmptyPages++;
            console.log(`PoiListPage: Página vacía ${this.consecutiveEmptyPages}`);
          }

          // Actualizar estado
          this.totalPois = response.total;
          this.hasMoreData = response.hasMore && this.consecutiveEmptyPages < this.maxEmptyPages;

          console.log(`PoiListPage: Nuevo estado:`, {
            totalPois: this.pois.length,
            hasMoreData: this.hasMoreData,
            currentPage: this.currentPage
          });

          // IMPORTANTE: Finalizar SIEMPRE
          this.isLoadingMore = false;
          this.cdr.detectChanges();
          event.target.complete();

          // Deshabilitar si no hay más
          if (!this.hasMoreData) {
            event.target.disabled = true;
            console.log('PoiListPage: Infinite scroll deshabilitado');
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
    
    this.currentCenter = { lat: poi.latitude, lng: poi.longitude };
    this.updateMapMarkers(poi.id);
    
    if (this.mapComponent) {
      this.mapComponent.centerMap(poi.latitude, poi.longitude, 15);
    }
  }

  onViewDetails(poi: POI) {
    console.log('PoiListPage: Ver detalles clickeado:', poi.name);
    this.router.navigate(['/poi-detail', poi.id]);
  }

  onFavoriteToggle(poi: POI) {
    const index = this.pois.findIndex(p => p.id === poi.id);
    if (index !== -1) {
      this.pois[index].isFavorite = !this.pois[index].isFavorite;
      console.log(`PoiListPage: Favorito toggled para ${poi.name}:`, this.pois[index].isFavorite);
      this.applyFilters();
    }
  }

  onMapClick(coordinates: { lat: number; lng: number }) {
    console.log('PoiListPage: Click en mapa:', coordinates);
  }

  onMapMarkerClick(marker: MapMarker) {
    console.log('PoiListPage: Marcador del mapa clickeado para ver detalles:', marker.title);
    // Buscar el POI correspondiente
    const poi = this.pois.find(p => p.id === marker.id);
    if (poi) {
      console.log('PoiListPage: Navegando a detalles del POI:', poi.name);
      this.router.navigate(['/poi-detail', poi.id]);
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
      // AÑADIR VERIFICACIÓN DE POIS PERSONALIZADOS
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

  private debugPoisState() {
    console.log('=== DEBUG POIS STATE ===');
    console.log('pois.length:', this.pois.length);
    console.log('Primeros 5 POIs:', this.pois.slice(0, 5).map(p => ({ 
      id: p.id, 
      name: p.name, 
      lat: p.latitude, 
      lng: p.longitude 
    })));
    console.log('filteredPois.length:', this.filteredPois.length);
    console.log('hasMoreData:', this.hasMoreData);
    console.log('totalPois:', this.totalPois);
    console.log('currentPage:', this.currentPage);
    console.log('======================');
  }
}