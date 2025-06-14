import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, 
  IonButton, IonIcon, IonTextarea, IonAvatar,
  IonSpinner, IonToast, IonAlert, 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  heart, 
  heartOutline, 
  share, 
  star, 
  starOutline, 
  send, 
  locationOutline, 
  timeOutline,
  arrowBack,
  personCircleOutline,
  createOutline,
  pencilOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { POI } from '../../components/poi-card/poi-card.component';
import { MapComponent } from '../../components/map/map.component';
import { FoursquareService } from '../../services/foursquare.service';
import { CustomPoiService } from '../../services/custom-poi.service'; // AÑADIR IMPORT
import { CommentsService } from '../../services/comments.service';

interface Comment {
  id: string;
  poiId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  text: string;
  date: Date;
  isOwn?: boolean;
}

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
  private customPoiService = inject(CustomPoiService); // AÑADIR INJECT
  private commentsService = inject(CommentsService);

  poi: POI | null = null;
  isLoading = true;
  isLoadingComments = true;
  isSubmittingComment = false;
  isCustomPoi = false; // AÑADIR VARIABLE PARA IDENTIFICAR POI PERSONALIZADO
  poiStats: { totalFavorites: number; isFavorite: boolean; canEdit: boolean } | null = null;
  poiCreator: { name: string; id: string } | null = null;
  
  // Estado del usuario (simulado)
  isLoggedIn = false; // Cambiar a true para simular usuario loggeado
  currentUser = {
    id: 'user123',
    name: 'Usuario Actual',
    avatar: 'https://via.placeholder.com/40/667eea/ffffff?text=U'
  };

  // Comentarios
  comments: Comment[] = [];
  newComment = '';
  newRating = 0;
  maxCommentLength = 500;
  
  // Estados UI
  showToast = false;
  toastMessage = '';
  showAlert = false;
  alertButtons = [
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => {
        this.showAlert = false;
      }
    },
    {
      text: 'Iniciar sesión',
      handler: () => {
        this.onLoginPrompt();
      }
    }
  ];

  // Exponer Math al template
  Math = Math;

  private subscription = new Subscription();

  constructor() {
    addIcons({ 
      heart, 
      heartOutline, 
      share, 
      star, 
      starOutline, 
      send, 
      locationOutline, 
      timeOutline,
      arrowBack,
      personCircleOutline,
      createOutline,
      pencilOutline
    });
  }

  ngOnInit() {
    console.log('PoiDetailPage: Inicializando...');
    
    this.subscription.add(
      this.route.params.subscribe(params => {
        const poiId = params['id'];
        if (poiId) {
          console.log('PoiDetailPage: Cargando POI con ID:', poiId);
          this.loadPoiDetail(poiId);
        } else {
          console.error('PoiDetailPage: No se proporcionó ID del POI');
          this.router.navigate(['/tabs/home']);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private loadPoiDetail(poiId: string) {
    this.isLoading = true;
    console.log('PoiDetailPage: Cargando POI con ID:', poiId);
    
    // MODIFICACIÓN: Verificar si es un POI personalizado
    this.isCustomPoi = poiId.startsWith('custom_');
    
    if (this.isCustomPoi) {
      console.log('PoiDetailPage: Cargando POI personalizado');
      this.loadCustomPoi(poiId);
    } else {
      console.log('PoiDetailPage: Cargando POI de Foursquare');
      this.loadFoursquarePoi(poiId);
    }
  }

  private loadCustomPoi(poiId: string) {
    const customPoi = this.customPoiService.getCustomPoiById(poiId);
    
    if (customPoi) {
      console.log('PoiDetailPage: POI personalizado encontrado:', customPoi.name);
      
      // Convertir CustomPOI a POI
      this.poi = {
        id: customPoi.id,
        name: customPoi.name,
        description: customPoi.description,
        image: customPoi.image,
        rating: customPoi.rating,
        reviewCount: customPoi.reviewCount,
        category: customPoi.category,
        distance: customPoi.distance,
        estimatedTime: customPoi.estimatedTime,
        latitude: customPoi.latitude,
        longitude: customPoi.longitude,
        isFavorite: customPoi.isFavorite
      };
      
      // NUEVO: Cargar estadísticas y creador
      this.poiStats = this.customPoiService.getPoiStats(poiId);
      this.poiCreator = {
        name: customPoi.userName,
        id: customPoi.userId
      };
      
      this.loadComments();
      this.isLoading = false;
    } else {
      console.error('PoiDetailPage: POI personalizado no encontrado');
      this.createMockPoiFromId(poiId);
    }
  }

  // MÉTODO MODIFICADO: Cargar POI de Foursquare
  private loadFoursquarePoi(poiId: string) {
    // Intentar obtener el POI desde cache de Foursquare
    const cachedPoi = this.foursquareService.findPoiInCache(poiId);
    if (cachedPoi) {
      console.log('PoiDetailPage: POI encontrado en cache:', cachedPoi.name);
      this.poi = cachedPoi;
      this.loadComments();
      this.isLoading = false;
      return;
    }

    // Si no está en cache, intentar obtener desde API
    this.subscription.add(
      this.foursquareService.getVenueDetails(poiId).subscribe({
        next: (poi) => {
          if (poi) {
            console.log('PoiDetailPage: POI obtenido desde API:', poi.name);
            this.poi = poi;
            this.loadComments();
            this.isLoading = false;
          } else {
            console.log('PoiDetailPage: POI no encontrado en API, creando mock');
            this.createMockPoiFromId(poiId);
          }
        },
        error: (error) => {
          console.error('PoiDetailPage: Error obteniendo POI desde API:', error);
          this.createMockPoiFromId(poiId);
        }
      })
    );
  }

  private createMockPoiFromId(poiId: string) {
    console.log('PoiDetailPage: Creando POI mock para ID:', poiId);
    
    // Crear POI básico cuando no se puede obtener de la API
    this.poi = {
      id: poiId,
      name: 'Lugar de interés',
      description: 'Información detallada no disponible. Este lugar ha sido encontrado a través de la búsqueda pero los detalles completos no están disponibles en este momento.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      rating: 0,
      reviewCount: 0,
      category: 'General',
      distance: 'Desconocida',
      estimatedTime: 'No disponible',
      latitude: 36.8377,
      longitude: -2.4585,
      isFavorite: false
    };
    
    this.loadComments();
    this.isLoading = false;
  }

  private loadComments() {
    if (!this.poi) return;
    
    this.isLoadingComments = true;
    
    this.subscription.add(
      this.commentsService.getCommentsByPoiId(this.poi.id).subscribe({
        next: (comments) => {
          console.log(`PoiDetailPage: Cargados ${comments.length} comentarios para ${this.poi?.name}`);
          this.comments = comments;
          this.isLoadingComments = false;
        },
        error: (error) => {
          console.error('PoiDetailPage: Error cargando comentarios:', error);
          this.comments = [];
          this.isLoadingComments = false;
        }
      })
    );
  }

  onBack() {
    this.router.navigate(['/tabs/home']);
  }

  onToggleFavorite() {
    if (this.poi) {
      if (this.isCustomPoi) {
        // Para POIs personalizados, usar el sistema de favoritos compartido
        const success = this.customPoiService.toggleFavorite(this.poi.id);
        if (success) {
          // Actualizar estadísticas locales
          this.poiStats = this.customPoiService.getPoiStats(this.poi.id);
          this.poi.isFavorite = this.poiStats?.isFavorite || false;
          
          this.showToastMessage(
            this.poi.isFavorite ? 'Añadido a favoritos' : 'Eliminado de favoritos'
          );
        }
      } else {
        // Para POIs de Foursquare, usar la lógica anterior
        this.poi.isFavorite = !this.poi.isFavorite;
        this.showToastMessage(
          this.poi.isFavorite ? 'Añadido a favoritos' : 'Eliminado de favoritos'
        );
      }
    }
  }

  onShare() {
    if (this.poi) {
      // Crear URL para compartir
      const shareUrl = `${window.location.origin}/poi-detail/${this.poi.id}`;
      
      // Intentar usar Web Share API si está disponible
      if (navigator.share) {
        navigator.share({
          title: this.poi.name,
          text: this.poi.description,
          url: shareUrl
        }).then(() => {
          this.showToastMessage('Compartido exitosamente');
        }).catch((error) => {
          console.error('Error sharing:', error);
          this.copyToClipboard(shareUrl);
        });
      } else {
        // Fallback: copiar al portapapeles
        this.copyToClipboard(shareUrl);
      }
    }
  }

  private copyToClipboard(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToastMessage('Enlace copiado al portapapeles');
      }).catch(() => {
        this.showToastMessage('No se pudo copiar el enlace');
      });
    } else {
      // Fallback para navegadores más antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        this.showToastMessage('Enlace copiado al portapapeles');
      } catch (err) {
        this.showToastMessage('No se pudo copiar el enlace');
      }
      document.body.removeChild(textArea);
    }
  }

  onRatingClick(rating: number) {
    if (this.isLoggedIn) {
      this.newRating = rating;
    }
  }

  onSubmitComment() {
    if (!this.poi || !this.isLoggedIn) {
      this.showAlert = true;
      return;
    }

    if (!this.newComment.trim() || this.newRating === 0) {
      this.showToastMessage('Por favor, añade un comentario y una valoración');
      return;
    }

    if (this.newComment.length > this.maxCommentLength) {
      this.showToastMessage(`El comentario no puede exceder ${this.maxCommentLength} caracteres`);
      return;
    }

    this.isSubmittingComment = true;

    // Simular delay de red
    setTimeout(() => {
      if (this.poi) {
        this.commentsService.addComment(
          this.poi.id,
          this.poi.name,
          { lat: this.poi.latitude, lng: this.poi.longitude },
          this.poi.category,
          this.poi.image,
          this.currentUser.id,
          this.currentUser.name,
          this.currentUser.avatar,
          this.newRating,
          this.newComment
        );

        // Limpiar formulario
        this.newComment = '';
        this.newRating = 0;
        this.isSubmittingComment = false;
        
        this.showToastMessage('Comentario añadido correctamente');
        
        // Recargar comentarios
        this.loadComments();
      }
    }, 1000);
  }

  private showToastMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onLoginPrompt() {
    this.showAlert = false;
    this.showToastMessage('Redirigiendo al login...');
  }

  getStarsArray(rating: number): boolean[] {
    const roundedRating = Math.round(rating);
    return Array(5).fill(false).map((_, i) => i < roundedRating);
  }

  get commentCharacterCount(): number {
    return this.newComment.length;
  }

  get isCommentValid(): boolean {
    return this.newComment.trim().length > 0 && 
           this.newComment.length <= this.maxCommentLength && 
           this.newRating > 0;
  }

  get mapMarkers() {
    if (!this.poi) return [];
    
    return [{
      id: this.poi.id,
      position: { lat: this.poi.latitude, lng: this.poi.longitude },
      title: this.poi.name,
      description: this.poi.description,
      category: this.poi.category,
      rating: this.poi.rating,
      distance: this.poi.distance,
      isSelected: true,
      isCustom: this.isCustomPoi // AÑADIR INDICADOR DE POI PERSONALIZADO
    }];
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  get canEditCurrentPoi(): boolean {
    return this.isCustomPoi && (this.poiStats?.canEdit || false);
  }

  // NUEVO: Método para navegar a edición (si se implementa)
  onEditPoi() {
    if (this.canEditCurrentPoi && this.poi) {
      console.log('PoiDetailPage: Navegando a edición del POI:', this.poi.id);
      // TODO: Implementar página de edición
      // this.router.navigate(['/edit-poi', this.poi.id]);
      this.showToastMessage('Función de edición próximamente disponible');
    }
  }
}