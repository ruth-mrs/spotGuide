import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import {
  IonContent, IonAvatar, IonButton, IonIcon, IonSpinner,
  IonFab, IonFabButton, IonItemOptions, IonItem, IonItemSliding,
  IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton,
  IonLabel, IonList, IonItemOption, IonChip } from '@ionic/angular/standalone';

import { PoiCardComponent, POI } from '../../components/poi-card/poi-card.component';
import { AuthService, User } from '../../services/auth.service';
import { CustomPoiService, CustomPOI } from '../../services/custom-poi.service';
import { FavoritesService, FavoritePoi } from '../../services/favorites.service';
import { HttpService } from '../../services/http.service';
import { ToastService } from '../../services/toast.service';
import { SearchService } from '../../services/search.service';
import { addIcons } from 'ionicons';
import { add, create, bookmark, grid, list, trash, heart } from 'ionicons/icons';

// Interface local para POIs guardados compatible
interface SavedPoi extends FavoritePoi {
  poiType: 'foursquare' | 'custom';
  savedAt: Date;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonChip, 
    IonContent, IonAvatar, IonButton, IonIcon, IonSpinner,
    IonFab, IonFabButton, IonItemOptions, IonItem, IonItemSliding,
    IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton,
    IonLabel, IonList, IonItemOption,
    CommonModule, PoiCardComponent
  ]
})
export class ProfilePage implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private customPoiService = inject(CustomPoiService);
  private favoritesService = inject(FavoritesService);
  private searchService = inject(SearchService);
  private httpService = inject(HttpService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  user: User & {
    totalPois: number;
    totalFavorites: number;
    memberSince: string;
  } | null = null;

  searchQuery = ''; // Nueva propiedad para el filtro
  filteredPublishedPois: (CustomPOI & { canEdit: boolean })[] = [];
  filteredSavedPois: SavedPoi[] = [];

  publishedPois: (CustomPOI & { canEdit: boolean })[] = [];
  savedPois: SavedPoi[] = [];
  
  selectedTab = 'published';
  selectedSegment = 'published';
  viewMode: 'grid' | 'list' = 'grid';
  isLoading = false;
  
  private subscription = new Subscription();
  private profileSearchSubject = new BehaviorSubject<string>('');
  public profileSearch$ = this.profileSearchSubject.asObservable();

  ngOnInit() {
    this.loadUserData();
    this.applyFilters();
    this.subscribeToProfileSearch();

    this.subscription.add(
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.urlAfterRedirects === '/profile') {
        this.loadPublishedPois();
        this.loadSavedPois();
        this.loadUserStats();
      }
    })
  );

    addIcons({
      add: add,
      create: create,
      bookmark: bookmark,
      grid: grid,
      list: list,
      trash: trash,
      heart: heart
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private loadUserData() {
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.user = {
            ...user,
            totalPois: 0,
            totalFavorites: 0,
            memberSince: this.formatJoinDate(user.joinDate)
          };
          
          this.loadUserStats();
          this.loadPublishedPois();
          this.loadSavedPois();
        } else {
          this.router.navigate(['/login']);
        }
      })
    );
  }

  private loadUserStats() {
    if (!this.user) return;

    this.subscription.add(
      this.customPoiService.getGeneralStats().subscribe({
        next: (stats) => {
          if (this.user) {
            this.user.totalPois = stats.userCreatedPois;
            this.user.totalFavorites = stats.userFavoritePois;
          }
        },
        error: (error) => {
          console.error('ProfilePage: Error cargando estadísticas:', error);
        }
      })
    );
  }

  private applyFilters() {
    // Filtrar POIs publicados
    if (this.searchQuery) {
      this.filteredPublishedPois = this.publishedPois.filter(poi =>
        poi.name.toLowerCase().includes(this.searchQuery) ||
        poi.description.toLowerCase().includes(this.searchQuery) ||
        poi.category.toLowerCase().includes(this.searchQuery)
      );

      this.filteredSavedPois = this.savedPois.filter(poi =>
        poi.name.toLowerCase().includes(this.searchQuery) ||
        poi.description.toLowerCase().includes(this.searchQuery) ||
        poi.category.toLowerCase().includes(this.searchQuery)
      );
    } else {
      this.filteredPublishedPois = [...this.publishedPois];
      this.filteredSavedPois = [...this.savedPois];
    }

    console.log(`ProfilePage: Filtrados - ${this.filteredPublishedPois.length} publicados, ${this.filteredSavedPois.length} guardados`);
  }

  private loadPublishedPois() {
    this.isLoading = true;
    
    this.subscription.add(
      this.httpService.getUserCustomPois().subscribe({
        next: (pois) => {
          this.publishedPois = pois.map(poi => ({
            ...poi,
            isCustom: true as const,
            canEdit: true
          }));
          this.applyFilters(); // Aplicar filtros después de cargar
          console.log(`ProfilePage: ${pois.length} POIs publicados cargados`);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('ProfilePage: Error cargando POIs publicados:', error);
          this.showToastMessage('Error cargando POIs publicados');
          this.isLoading = false;
        }
      })
    );
  }

  private loadSavedPois() {
    this.subscription.add(
      this.favoritesService.getUserFavorites().subscribe({
        next: (favorites) => {
          this.savedPois = favorites.map(fav => ({
            ...fav,
            poiType: fav.poiType || 'foursquare' as 'foursquare' | 'custom',
            savedAt: fav.savedAt
          }));
          this.applyFilters(); // Aplicar filtros después de cargar
          console.log(`ProfilePage: ${favorites.length} POIs guardados cargados`);
        },
        error: (error) => {
          console.error('ProfilePage: Error cargando POIs guardados:', error);
        }
      })
    );
  }

  // Refresh handler
  onRefresh(event: any) {
    this.loadUserData();
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  // Segment change handler
  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
    console.log('ProfilePage: Segment changed to:', this.selectedSegment);
  }

  // Toggle view mode
  onToggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
    console.log('ProfilePage: View mode changed to:', this.viewMode);
  }

 onEditProfile() {
  this.router.navigate(['/edit-profile']).then(() => {
    window.location.reload();
  });
}

  // POI click handlers
  onPoiClick(poi: CustomPOI | SavedPoi | POI) {
    this.router.navigate(['/poi', poi.id]);
  }

  onPoiCardEdit(poi: CustomPOI | SavedPoi | POI) {
    if ('isCustom' in poi && poi.isCustom) {
      this.router.navigate(['/edit-poi', poi.id]);
    }
  }

  onPoiCardDelete(poi: CustomPOI | SavedPoi | POI) {
    this.onDeletePoi(poi);
  }

  // Add missing onEditPoi method
  onEditPoi(poi: CustomPOI | SavedPoi) {
    if ('isCustom' in poi && poi.isCustom) {
      this.router.navigate(['/edit-poi', poi.id]);
    }
  }

   private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): string {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  onFavoriteToggle(poi: CustomPOI | SavedPoi | POI) {
    const poiData = {
      id: poi.id,
      name: poi.name,
      description: poi.description,
      image: poi.image,
      category: poi.category,
      latitude: poi.latitude,
      longitude: poi.longitude,
      rating: poi.rating,
      isCustom: 'isCustom' in poi ? poi.isCustom : false
    };

    this.subscription.add(
      this.favoritesService.toggleFavorite(poiData).subscribe({
        next: (result) => {
          if (result.success) {
            // Actualizar localmente el estado
            if ('isCustom' in poi && poi.isCustom) {
              const index = this.publishedPois.findIndex(p => p.id === poi.id);
              if (index !== -1) {
                this.publishedPois[index].isFavorite = result.isFavorite;
              }
            } else {
              // Es un POI de favoritos, si se desfavorece, removerlo de la lista
              if (!result.isFavorite) {
                this.savedPois = this.savedPois.filter(p => p.id !== poi.id);
              }
            }
            this.showToastMessage(result.message);
          } else {
            this.showToastMessage(result.message);
          }
        },
        error: (error) => {
          console.error('ProfilePage: Error toggle favorito:', error);
          this.showToastMessage('Error actualizando favorito');
        }
      })
    );
  }

  // Eliminar POI personalizado
  onDeletePoi(poi: CustomPOI | SavedPoi | POI) {
    if ('isCustom' in poi && poi.isCustom && 'canEdit' in poi && poi.canEdit) {
      // Solo permitir eliminar POIs creados por el usuario
      this.subscription.add(
        this.httpService.deleteCustomPoi(poi.id).subscribe({
          next: (result) => {
            if (result.success) {
              this.publishedPois = this.publishedPois.filter(p => p.id !== poi.id);
              this.showToastMessage(result.message);
              this.loadUserData(); // Actualizar estadísticas
            } else {
              this.showToastMessage(result.message);
            }
          },
          error: (error) => {
            console.error('ProfilePage: Error deleting POI:', error);
            this.showToastMessage('Error eliminando POI');
          }
        })
      );
    }
  }

  // Add new POI
  onAddNewPoi() {
    this.router.navigate(['/add-poi']);
  }

  // Helper methods
  getTimeJoined(): string {
    return this.user?.memberSince || '';
  }

  getStarsArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  isSavedPoi(poi: CustomPOI | SavedPoi): poi is SavedPoi {
    return 'savedAt' in poi;
  }

  // Update the formatSavedPoiDate method to handle the type properly
  formatSavedPoiDate(poi: CustomPOI | SavedPoi): string {
    if (this.isSavedPoi(poi)) {
      return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short'
      }).format(poi.savedAt);
    }
    return '';
  }

  trackByPoiId(index: number, poi: CustomPOI | SavedPoi): string {
    return poi.id;
  }

  private formatJoinDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  }

  private showToastMessage(message: string) {
    this.toastService.info(message);
  }

  get currentPois(): (CustomPOI | SavedPoi)[] {
    return this.selectedSegment === 'published' ? this.filteredPublishedPois : this.filteredSavedPois;
  }

  get hasNoPois(): boolean {
    return this.currentPois.length === 0;
  }

  get emptyStateMessage(): string {
    return this.selectedSegment === 'published' 
      ? 'No tienes POIs publicados'
      : 'No tienes POIs guardados';
  }

  get emptyStateSubtitle(): string {
    return this.selectedSegment === 'published' 
      ? 'No has publicado ningún punto de interés aún'
      : 'No tienes puntos guardados aún';
  }

  get emptyStateAction(): string {
    return this.selectedSegment === 'published' 
      ? 'Crear primer POI'
      : 'Explorar POIs';
  }

  private subscribeToProfileSearch() {

  }

  onEmptyStateAction() {
    if (this.selectedSegment === 'published') {
      this.router.navigate(['/add-poi']);
    } else {
      this.router.navigate(['/pois']);
    }
  }

  onSearchFromToolbar(query: string) {
    this.searchQuery = query.toLowerCase().trim();
    console.log('ProfilePage: Filtrar POIs con query:', this.searchQuery);
    this.applyFilters();
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
    // Limpiar también en el servicio
    this.searchService.clearProfileSearch();
  }

// Método para establecer búsqueda de perfil
  setProfileSearchQuery(query: string): void {
    this.profileSearchSubject.next(query);
    console.log('SearchService: Profile search query set:', query);
  }

  // Método para limpiar búsqueda de perfil
  clearProfileSearch(): void {
    this.profileSearchSubject.next('');
    console.log('SearchService: Profile search cleared');
  }
}