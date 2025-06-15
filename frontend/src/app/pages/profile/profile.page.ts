import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonContent, IonAvatar, IonButton, IonIcon, IonSpinner,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonFab, IonFabButton, IonItemOptions, IonItem, IonItemSliding,
  IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton,
  IonLabel, IonList, IonItemOption
} from '@ionic/angular/standalone';

import { PoiCardComponent, POI } from '../../components/poi-card/poi-card.component';
import { AuthService, User } from '../../services/auth.service';
import { CustomPoiService, CustomPOI } from '../../services/custom-poi.service';
import { FavoritesService, FavoritePoi } from '../../services/favorites.service';
import { CommentsService } from '../../services/comments.service';
import { HttpService } from '../../services/http.service';
import { ToastService } from '../../services/toast.service';

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
  imports: [
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
  private commentsService = inject(CommentsService);
  private httpService = inject(HttpService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  user: User & {
    totalPois: number;
    totalFavorites: number;
    memberSince: string;
  } | null = null;

  publishedPois: (CustomPOI & { canEdit: boolean })[] = [];
  savedPois: SavedPoi[] = [];
  
  selectedTab = 'published';
  selectedSegment = 'published';
  viewMode: 'grid' | 'list' = 'grid';
  isLoading = false;
  
  private subscription = new Subscription();

  ngOnInit() {
    this.loadUserData();
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

  // Editar perfil
  onEditProfile() {
    console.log('ProfilePage: Navegando a editar perfil');
    this.router.navigate(['/edit-profile']);
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

  // Getters
  get currentPois(): (CustomPOI | SavedPoi)[] {
    return this.selectedSegment === 'published' ? this.publishedPois : this.savedPois;
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

  onEmptyStateAction() {
    if (this.selectedSegment === 'published') {
      this.router.navigate(['/add-poi']);
    } else {
      this.router.navigate(['/pois']);
    }
  }
}