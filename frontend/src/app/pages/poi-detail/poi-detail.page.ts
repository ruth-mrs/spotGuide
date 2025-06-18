import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap, of } from 'rxjs';
import { 
  IonContent, IonButton, IonIcon, IonTextarea, IonAvatar,
  IonSpinner, IonToast, IonAlert 
} from '@ionic/angular/standalone';

import { MapComponent } from '../../components/map/map.component';
import { POI } from '../../components/poi-card/poi-card.component'; // Import POI directly
import { FoursquareService } from '../../services/foursquare.service';
import { CustomPoiService, CustomPOI } from '../../services/custom-poi.service';
import { CommentsService, Comment } from '../../services/comments.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService, User } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { addIcons } from 'ionicons';
import { 
  heartOutline, 
  heart, 
  share,
  locationOutline,
  timeOutline,
  star,
  starOutline,
  personCircleOutline,
  createOutline,
  send
} from 'ionicons/icons';

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

   constructor() {
    addIcons({
      heartOutline,
      heart,
      share,
      locationOutline,
      timeOutline,
      star,
      starOutline,
      personCircleOutline,
      createOutline,
      send
    });
  }

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

      console.log('PoiDetailPage: Loading POI with ID:', poiId);

      // Mejorar la detección de POI personalizado vs Foursquare
      if (this.isCustomPoiId(poiId)) {
        console.log('PoiDetailPage: Loading as custom POI');
        this.loadCustomPoi(poiId);
      } else {
        console.log('PoiDetailPage: Loading as Foursquare POI');
        this.loadFoursquarePoi(poiId);
      }
    } catch (error) {
      console.error('Error in loadPoiData:', error);
      this.isLoading = false;
      this.showToastMessage('Error cargando POI');
      this.router.navigate(['/pois']);
    }
  }

  private isCustomPoiId(id: string): boolean {   
    if (id.length !== 24) {
      return false;
    }
    
    const hexPattern = /^[0-9a-fA-F]{24}$/;
    const isHex = hexPattern.test(id);
    
    const foursquarePattern = /^[4-5][0-9a-f]/i; 
    const looksLikeFoursquare = foursquarePattern.test(id);
    
    console.log('PoiDetailPage: ID analysis:', {
      id,
      length: id.length,
      isHex,
      looksLikeFoursquare,
      decision: isHex && !looksLikeFoursquare ? 'custom' : 'foursquare'
    });
    
    // Es custom si es hex y NO parece ser de Foursquare
    return isHex && !looksLikeFoursquare;
  }

  private loadCustomPoi(poiId: string) {
    this.isCustomPoi = true;
    
    this.subscription.add(
      this.customPoiService.getCustomPoiById(poiId).subscribe({
        next: (customPoi) => {
          if (customPoi) {
            console.log('PoiDetailPage: Custom POI loaded:', customPoi.name);
            this.poi = customPoi;
            this.poiCreator = {
              name: customPoi.userName,
              avatar: 'assets/avatars/default-avatar.png'
            };
            this.canEditCurrentPoi = this.currentUser ? customPoi.userId === this.currentUser.id : false;
            this.poiStats = {
              totalFavorites: customPoi.totalFavorites || 0
            };
            this.setupMapMarkers();
            this.loadComments();
          } else {
            console.error('PoiDetailPage: Custom POI not found');
            this.showToastMessage('POI no encontrado');
            this.router.navigate(['/pois']);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('PoiDetailPage: Error loading custom POI:', error);
          // Si falla como custom POI, intentar como Foursquare
          console.log('PoiDetailPage: Trying as Foursquare POI instead');
          this.isCustomPoi = false;
          this.loadFoursquarePoi(poiId);
        }
      })
    );
  }

  private loadFoursquarePoi(poiId: string) {
    this.isCustomPoi = false;
    
    this.subscription.add(
      this.foursquareService.getPoiById(poiId).subscribe({
        next: (foursquarePoi: POI | null) => {
          if (foursquarePoi) {
            console.log('PoiDetailPage: Foursquare POI loaded:', foursquarePoi.name);
            this.poi = foursquarePoi;
            this.poiCreator = null;
            this.canEditCurrentPoi = false;
            this.poiStats = null;
            this.setupMapMarkers();
            this.loadComments();
          } else {
            console.error('PoiDetailPage: Foursquare POI not found');
            this.showToastMessage('POI no encontrado');
            this.router.navigate(['/pois']);
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('PoiDetailPage: Error loading Foursquare POI:', error);
          this.showToastMessage('Error cargando POI');
          this.router.navigate(['/pois']);
          this.isLoading = false;
        }
      })
    );
  }

  private loadComments() {
    if (!this.poi) return;
    
    this.isLoadingComments = true;
    console.log('PoiDetailPage: Loading comments for POI:', this.poi.id);
    
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
        rating: this.poi.rating,
        isCustom: this.isCustomPoi
      }];
    }
  }

  onToggleFavorite() {
  console.log('=== POI DETAIL: TOGGLE FAVORITO INICIADO ===');
  
  if (!this.isLoggedIn) {
    console.log('PoiDetailPage: ❌ Usuario no loggeado');
    this.showLoginPrompt();
    return;
  }

  if (!this.poi) {
    console.log('PoiDetailPage: ❌ No hay POI cargado');
    return;
  }

  // Verificaciones de autenticación
  console.log('PoiDetailPage: Verificaciones de auth:');
  console.log('- this.isLoggedIn:', this.isLoggedIn);
  console.log('- this.currentUser:', this.currentUser);
  console.log('- AuthService.getCurrentUser():', this.authService.getCurrentUser());

  console.log('PoiDetailPage: POI actual:', {
    id: this.poi.id,
    name: this.poi.name,
    isFavorite: this.poi.isFavorite,
    isCustom: this.isCustomPoi
  });

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

  console.log('PoiDetailPage: 📤 Enviando datos del POI:', poiData);

  this.subscription.add(
    this.favoritesService.toggleFavorite(poiData).subscribe({
      next: (result) => {
        console.log('PoiDetailPage: 📥 Resultado recibido:', result);
        
        if (result.success) {
          console.log('PoiDetailPage: ✅ Toggle exitoso');
          
          // Actualizar estado local
          const previousState = this.poi!.isFavorite;
          this.poi!.isFavorite = result.isFavorite;
          
          console.log(`PoiDetailPage: Estado cambió de ${previousState} a ${this.poi!.isFavorite}`);
          
          // Actualizar stats si es POI personalizado
          if (this.isCustomPoi && this.poiStats) {
            const change = result.isFavorite ? 1 : -1;
            this.poiStats.totalFavorites += change;
            console.log(`PoiDetailPage: Stats actualizados: ${this.poiStats.totalFavorites} favoritos`);
          }
          
          this.showToastMessage(result.message);
        } else {
          console.log('PoiDetailPage: ❌ Toggle falló:', result.message);
          this.showToastMessage(result.message);
        }
      },
      error: (error) => {
        console.error('PoiDetailPage: 💥 Error en toggle:', error);
        this.showToastMessage('Error actualizando favorito');
      }
    })
  );
  
  console.log('=== POI DETAIL: TOGGLE FAVORITO FIN ===');
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