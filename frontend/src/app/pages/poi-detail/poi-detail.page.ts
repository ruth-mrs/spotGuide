import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { 
  IonContent, IonButton, IonIcon, IonTextarea, IonAvatar,
  IonSpinner, IonToast, IonAlert 
} from '@ionic/angular/standalone';

import { MapComponent } from '../../components/map/map.component';
import { FoursquareService, POI } from '../../services/foursquare.service';
import { CustomPoiService, CustomPOI } from '../../services/custom-poi.service';
import { CommentsService, Comment } from '../../services/comments.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService, User } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-poi-detail',
  templateUrl: './poi-detail.page.html',
  styleUrls: ['./poi-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonButton, IonIcon, IonTextarea, IonAvatar,
    IonSpinner, IonToast, IonAlert, 
    CommonModule, FormsModule, MapComponent
  ]
})
export class PoiDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private foursquareService = inject(FoursquareService);
  private customPoiService = inject(CustomPoiService);
  private commentsService = inject(CommentsService);
  private favoritesService = inject(FavoritesService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  poi: POI | CustomPOI | null = null;
  comments: Comment[] = [];
  mapMarkers: any[] = [];
  
  // Usuario actual
  currentUser: User | null = null;
  isLoggedIn = false;
  
  // Comentarios
  newComment = '';
  newRating = 5;
  maxCommentLength = 500;
  isSubmittingComment = false;
  isLoadingComments = false;
  
  // Estados
  isLoading = false;
  showToast = false;
  toastMessage = '';
  showAlert = false;
  
  // Información específica para POIs personalizados
  isCustomPoi = false;
  poiCreator: { name: string; avatar?: string } | null = null;
  canEditCurrentPoi = false;
  poiStats: { totalFavorites: number } | null = null;

  alertButtons = [
    {
      text: 'Cancelar',
      role: 'cancel'
    },
    {
      text: 'Iniciar sesión',
      handler: () => {
        this.router.navigate(['/login']);
      }
    }
  ];

  private subscription = new Subscription();

  ngOnInit() {
    this.loadUserData();
    this.loadPoiData();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private loadUserData() {
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        this.isLoggedIn = !!user;
      })
    );
  }

  private async loadPoiData() {
    this.isLoading = true;
    
    try {
      const poiId = this.route.snapshot.paramMap.get('id');
      if (!poiId) {
        this.router.navigate(['/pois']);
        return;
      }

      // Verificar si es POI personalizado (MongoDB ObjectId)
      if (this.isCustomPoiId(poiId)) {
        this.isCustomPoi = true;
        this.subscription.add(
          this.customPoiService.getCustomPoiById(poiId).subscribe({
            next: (customPoi) => {
              if (customPoi) {
                this.poi = customPoi;
                this.poiCreator = {
                  name: customPoi.userName,
                  avatar: 'assets/avatars/default-avatar.png'
                };
                this.canEditCurrentPoi = this.currentUser ? customPoi.userId === this.currentUser.id : false;
                this.poiStats = {
                  totalFavorites: customPoi.totalFavorites
                };
                this.setupMapMarkers();
                this.loadComments();
              } else {
                this.showToastMessage('POI no encontrado');
                this.router.navigate(['/pois']);
              }
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error loading custom POI:', error);
              this.showToastMessage('Error cargando POI');
              this.router.navigate(['/pois']);
              this.isLoading = false;
            }
          })
        );
      } else {
        // Cargar POI de Foursquare
        this.subscription.add(
          this.foursquareService.getPoiById(poiId).subscribe({
            next: (foursquarePoi: POI | null) => {
              if (foursquarePoi) {
                this.poi = foursquarePoi;
                this.setupMapMarkers();
                this.loadComments();
              } else {
                this.showToastMessage('POI no encontrado');
                this.router.navigate(['/pois']);
              }
              this.isLoading = false;
            },
            error: (error: any) => {
              console.error('Error loading Foursquare POI:', error);
              this.showToastMessage('Error cargando POI');
              this.router.navigate(['/pois']);
              this.isLoading = false;
            }
          })
        );
      }
    } catch (error) {
      console.error('Error in loadPoiData:', error);
      this.isLoading = false;
    }
  }

  private isCustomPoiId(id: string): boolean {
    return id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
  }

  private loadComments() {
    if (!this.poi) return;
    
    this.isLoadingComments = true;
    
    this.subscription.add(
      this.commentsService.getCommentsByPoiId(this.poi.id).subscribe({
        next: (comments) => {
          console.log(`PoiDetailPage: Loaded ${comments.length} comments for ${this.poi?.name}`);
          this.comments = comments;
          this.isLoadingComments = false;
        },
        error: (error) => {
          console.error('PoiDetailPage: Error loading comments:', error);
          this.comments = [];
          this.isLoadingComments = false;
        }
      })
    );
  }

  private setupMapMarkers() {
    if (this.poi) {
      this.mapMarkers = [{
        id: this.poi.id,
        position: { lat: this.poi.latitude, lng: this.poi.longitude },
        title: this.poi.name,
        description: this.poi.description,
        category: this.poi.category,
        rating: this.poi.rating
      }];
    }
  }

  onToggleFavorite() {
    if (!this.isLoggedIn) {
      this.showLoginPrompt();
      return;
    }

    if (this.poi) {
      const poiData = {
        id: this.poi.id,
        name: this.poi.name,
        description: this.poi.description,
        image: this.poi.image,
        category: this.poi.category,
        latitude: this.poi.latitude,
        longitude: this.poi.longitude,
        rating: this.poi.rating,
        isCustom: this.isCustomPoi
      };

      this.subscription.add(
        this.favoritesService.toggleFavorite(poiData).subscribe({
          next: (result) => {
            if (result.success) {
              this.poi!.isFavorite = result.isFavorite;
              this.showToastMessage(result.message);
            } else {
              this.showToastMessage(result.message);
            }
          },
          error: (error) => {
            console.error('PoiDetailPage: Error toggle favorito:', error);
            this.showToastMessage('Error actualizando favorito');
          }
        })
      );
    }
  }

  onSubmitComment() {
    if (!this.isLoggedIn) {
      this.showLoginPrompt();
      return;
    }

    if (!this.isCommentValid || !this.poi || !this.currentUser) return;

    this.isSubmittingComment = true;

    this.subscription.add(
      this.commentsService.addComment(
        this.poi.id,
        this.poi.name,
        { lat: this.poi.latitude, lng: this.poi.longitude },
        this.poi.category,
        this.poi.image,
        this.currentUser.id,
        this.currentUser.name,
        this.currentUser.avatar || 'assets/avatars/default-avatar.png',
        this.newRating,
        this.newComment
      ).subscribe({
        next: (result) => {
          if (result.success && result.comment) {
            this.comments.unshift(result.comment);
            this.newComment = '';
            this.newRating = 5;
            this.showToastMessage('Comentario añadido exitosamente');
          } else {
            this.showToastMessage(result.message);
          }
          this.isSubmittingComment = false;
        },
        error: (error) => {
          console.error('PoiDetailPage: Error añadiendo comentario:', error);
          this.showToastMessage('Error añadiendo comentario');
          this.isSubmittingComment = false;
        }
      })
    );
  }

  onRatingClick(rating: number) {
    this.newRating = rating;
  }

  onEditPoi() {
    if (this.poi && this.isCustomPoi) {
      this.router.navigate(['/edit-poi', this.poi.id]);
    }
  }

  onShare() {
    if (this.poi) {
      if (navigator.share) {
        navigator.share({
          title: this.poi.name,
          text: this.poi.description,
          url: window.location.href
        });
      } else {
        // Fallback para navegadores que no soportan Web Share API
        navigator.clipboard.writeText(window.location.href);
        this.showToastMessage('Enlace copiado al portapapeles');
      }
    }
  }

  onLoginPrompt() {
    this.showAlert = true;
  }

  private showLoginPrompt() {
    this.showAlert = true;
  }

  private showToastMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
  }

  // Getters y helpers
  get isCommentValid(): boolean {
    return this.newComment.trim().length > 0 && 
           this.newComment.length <= this.maxCommentLength &&
           this.newRating >= 1 && this.newRating <= 5;
  }

  get commentCharacterCount(): number {
    return this.newComment.length;
  }

  getStarsArray(rating: number): boolean[] {
    return Array(5).fill(0).map((_, i) => i < rating);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}