import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, 
  IonButton, IonIcon, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonItem, IonLabel, IonSpinner, IonToast, IonAlert, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonActionSheet, IonImg
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  camera, 
  image, 
  location, 
  save, 
  close,
  arrowBack,
  checkmark,
  alertCircle
} from 'ionicons/icons';
import { Subscription } from 'rxjs';

import { MapComponent } from '../../components/map/map.component';
import { CustomPoiService, CustomPOI } from '../../services/custom-poi.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-add-poi',
  templateUrl: './add-poi.page.html',
  styleUrls: ['./add-poi.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButton, IonIcon, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonItem, IonLabel, IonSpinner, IonToast, IonAlert, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonActionSheet, IonImg,
    CommonModule, FormsModule, MapComponent
  ]
})
export class AddPoiPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private customPoiService = inject(CustomPoiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  @ViewChild(MapComponent) mapComponent!: MapComponent;

  // Formulario
  poiName = '';
  poiDescription = '';
  poiCategory = 'general';
  poiImageUrl = '';
  poiImageFromCamera = '';
  selectedImageType: 'url' | 'camera' | null = null;

  // Ubicación
  selectedLocation = {
    latitude: 36.8377, // Almería por defecto
    longitude: -2.4585
  };
  currentUserLocation = {
    latitude: 36.8377,
    longitude: -2.4585
  };
  locationAccuracy?: number;

  // Estados UI
  isLoading = false;
  isGettingLocation = false;
  isTakingPhoto = false;
  isSaving = false;
  showImageActionSheet = false;
  showToast = false;
  toastMessage = '';
  toastColor = 'success';
  showLocationAlert = false;

  // Validaciones
  nameMaxLength = 100;
  descriptionMaxLength = 500;

  // Categorías disponibles
  categories = [
    { value: 'historical', label: 'Histórico' },
    { value: 'nature', label: 'Naturaleza' },
    { value: 'restaurant', label: 'Restaurante' },
    { value: 'entertainment', label: 'Entretenimiento' },
    { value: 'shopping', label: 'Compras' },
    { value: 'culture', label: 'Cultura' },
    { value: 'sports', label: 'Deportes' },
    { value: 'health', label: 'Salud' },
    { value: 'education', label: 'Educación' },
    { value: 'transport', label: 'Transporte' },
    { value: 'general', label: 'General' }
  ];

  // Current user from auth service
  currentUser = this.authService.getCurrentUser();

  private subscription = new Subscription();

  imageActionSheetButtons = [
    {
      text: 'Tomar foto',
      icon: 'camera',
      handler: () => {
        this.onImageTypeSelected('camera');
      }
    },
    {
      text: 'URL de imagen',
      icon: 'link',
      handler: () => {
        this.onImageTypeSelected('url');
      }
    },
    {
      text: 'Cancelar',
      icon: 'close',
      role: 'cancel'
    }
  ];

  // Add the missing cancel alert buttons
  cancelAlertButtons = [
    {
      text: 'Continuar editando',
      role: 'cancel',
      handler: () => {
        this.showLocationAlert = false;
      }
    },
    {
      text: 'Descartar',
      handler: () => {
        this.onConfirmCancel();
      }
    }
  ];

  constructor() {
    addIcons({
      camera,
      image,
      location,
      save,
      close,
      arrowBack,
      checkmark,
      alertCircle
    });
  }

  ngOnInit() {
    console.log('AddPoiPage: Inicializando página de añadir POI');
    
    // Verificar si el usuario está autenticado
    if (!this.authService.isLoggedIn()) {
      this.toastService.error('Debes iniciar sesión para añadir POIs');
      this.router.navigate(['/login']);
      return;
    }

    this.getCurrentLocation();
    
    // Añadir animación de entrada
    setTimeout(() => {
      const container = document.querySelector('.form-container');
      container?.classList.add('animate-in');
    }, 100);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  isValidImageUrl(): boolean {
    if (!this.poiImageUrl || this.poiImageUrl.trim().length === 0) {
      return false;
    }

    // Basic URL validation
    try {
      const url = new URL(this.poiImageUrl);
      // Check if it's a valid http/https URL
      if (!['http:', 'https:'].includes(url.protocol)) {
        return false;
      }
      
      // Check if it looks like an image URL
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const hasImageExtension = imageExtensions.some(ext => 
        url.pathname.toLowerCase().includes(ext)
      );
      
      // Accept if it has image extension or if it's from common image hosting services
      const isImageHost = [
        'images.unsplash.com',
        'imgur.com',
        'i.imgur.com',
        'cdn.pixabay.com',
        'images.pexels.com',
        'firebasestorage.googleapis.com'
      ].some(host => url.hostname.includes(host));

      return hasImageExtension || isImageHost || url.pathname.includes('image');
    } catch {
      return false;
    }
  }

  async getCurrentLocation() {
    this.isGettingLocation = true;
    
    try {
      const location = await this.customPoiService.getCurrentPosition();
      this.currentUserLocation = {
        latitude: location.latitude,
        longitude: location.longitude
      };
      this.selectedLocation = { ...this.currentUserLocation };
      this.locationAccuracy = location.accuracy;

      console.log('AddPoiPage: Ubicación actual obtenida:', this.currentUserLocation);
      
      // Actualizar marcador en el mapa
      this.updateMapMarker();
      
      // Centrar mapa en ubicación actual
      if (this.mapComponent) {
        this.mapComponent.centerMap(location.latitude, location.longitude, 15);
      }

      this.toastService.success('Ubicación obtenida correctamente');
    } catch (error) {
      console.error('AddPoiPage: Error obteniendo ubicación:', error);
      this.toastService.warning('No se pudo obtener la ubicación actual');
    } finally {
      this.isGettingLocation = false;
    }
  }

  onSelectImageType() {
    this.showImageActionSheet = true;
  }

  async onImageTypeSelected(type: 'url' | 'camera') {
    this.selectedImageType = type;
    
    if (type === 'camera') {
      await this.takePhoto();
    }
  }

  async takePhoto() {
    this.isTakingPhoto = true;
    
    try {
      const photoData = await this.customPoiService.takePicture();
      this.poiImageFromCamera = photoData;
      this.toastService.success('Foto tomada correctamente');
    } catch (error) {
      console.error('AddPoiPage: Error tomando foto:', error);
      this.toastService.error('Error tomando la foto');
    } finally {
      this.isTakingPhoto = false;
    }
  }

  onMapClick(event: { lat: number; lng: number }) {
    console.log('AddPoiPage: Ubicación seleccionada en mapa:', event);
    this.selectedLocation = {
      latitude: event.lat,
      longitude: event.lng
    };

    // Actualizar marcador en el mapa
    this.updateMapMarker();
  }

  private updateMapMarker() {
    if (this.mapComponent) {
      const marker = {
        id: 'selected-location',
        position: { 
          lat: this.selectedLocation.latitude, 
          lng: this.selectedLocation.longitude 
        },
        title: 'Ubicación del POI',
        description: this.poiName || 'Nuevo POI personalizado',
        isSelected: true
      };

      this.mapComponent.updateMarkers([marker]);
    }
  }

  onUseCurrentLocation() {
    this.selectedLocation = { ...this.currentUserLocation };
    this.updateMapMarker();
    
    if (this.mapComponent) {
      this.mapComponent.centerMap(
        this.currentUserLocation.latitude, 
        this.currentUserLocation.longitude, 
        15
      );
    }

    this.toastService.success('Ubicación actual seleccionada');
  }

  async onSavePoi() {
    if (!this.isFormValid()) {
      this.toastService.warning('Por favor, completa todos los campos requeridos');
      return;
    }

    if (!this.currentUser) {
      this.toastService.error('Usuario no autenticado');
      this.router.navigate(['/login']);
      return;
    }

    this.isSaving = true;

    try {
      // Determinar la imagen a usar
      const finalImage = this.selectedImageType === 'camera' 
        ? this.poiImageFromCamera 
        : this.poiImageUrl;

      if (!finalImage) {
        this.toastService.warning('Por favor, añade una imagen');
        this.isSaving = false;
        return;
      }

      const customPoi = await this.customPoiService.addCustomPoi(
        this.poiName,
        this.poiDescription,
        this.poiCategory,
        finalImage,
        this.selectedImageType!,
        this.selectedLocation.latitude,
        this.selectedLocation.longitude,
        this.currentUser.id,
        this.currentUser.name,
        this.currentUserLocation
      );

      console.log('AddPoiPage: POI personalizado creado:', customPoi.name);
      this.toastService.success('POI añadido correctamente');

      // Navegar a los detalles del POI creado
      setTimeout(() => {
        console.log('AddPoiPage: Navegando a detalles del POI creado:', customPoi.id);
        this.router.navigate(['/poi', customPoi.id]);
      }, 1500);

    } catch (error) {
      console.error('AddPoiPage: Error guardando POI:', error);
      this.toastService.error('Error al guardar el POI');
    } finally {
      this.isSaving = false;
    }
  }

  onCancel() {
    if (this.hasUnsavedChanges()) {
      // Mostrar alerta de confirmación
      this.showLocationAlert = true;
    } else {
      this.router.navigate(['/pois']);
    }
  }

  onConfirmCancel() {
    this.router.navigate(['/pois']);
  }

  private hasUnsavedChanges(): boolean {
    return !!(
      this.poiName.trim() ||
      this.poiDescription.trim() ||
      this.poiImageUrl.trim() ||
      this.poiImageFromCamera ||
      this.poiCategory !== 'general'
    );
  }

  isFormValid(): boolean {
    const hasValidImage = this.selectedImageType === 'url' 
      ? this.isValidImageUrl() 
      : this.poiImageFromCamera.length > 0;

    return this.isNameValid && 
           this.isDescriptionValid && 
           this.poiCategory.length > 0 &&
           hasValidImage;
  }

  // Getters para el template
  get nameCharacterCount(): number {
    return this.poiName.length;
  }

  get descriptionCharacterCount(): number {
    return this.poiDescription.length;
  }

  get isNameValid(): boolean {
    return this.poiName.trim().length >= 3 && this.poiName.length <= this.nameMaxLength;
  }

  get isDescriptionValid(): boolean {
    return this.poiDescription.trim().length >= 10 && this.poiDescription.length <= this.descriptionMaxLength;
  }

  get selectedImage(): string {
    return this.selectedImageType === 'camera' ? this.poiImageFromCamera : this.poiImageUrl;
  }

  get mapCenter() {
    return {
      lat: this.selectedLocation.latitude,
      lng: this.selectedLocation.longitude
    };
  }

  get mapMarkers() {
    return [{
      id: 'selected-location',
      position: { 
        lat: this.selectedLocation.latitude, 
        lng: this.selectedLocation.longitude 
      },
      title: this.poiName || 'Ubicación del POI',
      description: this.poiDescription || 'Nuevo POI personalizado',
      isSelected: true
    }];
  }
}