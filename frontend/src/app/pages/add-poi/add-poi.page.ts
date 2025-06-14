import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
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
    { value: 'culture', label: 'Cultura' },
    { value: 'shopping', label: 'Compras' },
    { value: 'accommodation', label: 'Alojamiento' },
    { value: 'entertainment', label: 'Entretenimiento' },
    { value: 'sports', label: 'Deportes' },
    { value: 'health', label: 'Salud' },
    { value: 'education', label: 'Educación' },
    { value: 'transport', label: 'Transporte' },
    { value: 'general', label: 'General' }
  ];

  // Usuario simulado (integrar con servicio de autenticación real)
  currentUser = {
    id: 'user123',
    name: 'Usuario Actual'
  };

  private subscription = new Subscription();

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
    this.getCurrentLocation();
    
    // Añadir animación de entrada similar a login/register
    setTimeout(() => {
      const container = document.querySelector('.form-container');
      container?.classList.add('animate-in');
    }, 100);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
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
      
      // Centrar mapa en ubicación actual
      if (this.mapComponent) {
        this.mapComponent.centerMap(location.latitude, location.longitude, 15);
      }

      this.showToastMessage('Ubicación obtenida correctamente', 'success');
    } catch (error) {
      console.error('AddPoiPage: Error obteniendo ubicación:', error);
      this.showToastMessage('No se pudo obtener la ubicación actual', 'warning');
    } finally {
      this.isGettingLocation = false;
    }
  }

  onSelectImageType() {
    this.showImageActionSheet = true;
  }

  async onImageTypeSelected(type: 'url' | 'camera') {
    this.showImageActionSheet = false;
    this.selectedImageType = type;

    if (type === 'camera') {
      await this.takePhoto();
    } else {
      // Limpiar imagen de cámara si se selecciona URL
      this.poiImageFromCamera = '';
    }
  }

  async takePhoto() {
    this.isTakingPhoto = true;
    
    try {
      const imageDataUrl = await this.customPoiService.takePicture();
      this.poiImageFromCamera = imageDataUrl;
      this.poiImageUrl = ''; // Limpiar URL si se toma foto
      console.log('AddPoiPage: Foto tomada exitosamente');
      this.showToastMessage('Foto tomada correctamente', 'success');
    } catch (error) {
      console.error('AddPoiPage: Error tomando foto:', error);
      this.showToastMessage('No se pudo tomar la foto', 'danger');
      this.selectedImageType = null;
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

    this.showToastMessage('Ubicación actual seleccionada', 'success');
  }

  async onSavePoi() {
    if (!this.isFormValid()) {
      this.showToastMessage('Por favor, completa todos los campos requeridos', 'warning');
      return;
    }

    this.isSaving = true;

    try {
      // Determinar la imagen a usar
      const finalImage = this.selectedImageType === 'camera' 
        ? this.poiImageFromCamera 
        : this.poiImageUrl;

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
      this.showToastMessage('POI añadido correctamente', 'success');

      // CAMBIO PRINCIPAL: Navegar a los detalles del POI creado
      setTimeout(() => {
        console.log('AddPoiPage: Navegando a detalles del POI creado:', customPoi.id);
        this.router.navigate(['/poi', customPoi.id]);
      }, 1500);

    } catch (error) {
      console.error('AddPoiPage: Error guardando POI:', error);
      this.showToastMessage('Error al guardar el POI', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  onCancel() {
    if (this.hasUnsavedChanges()) {
      this.showLocationAlert = true;
    } else {
      this.router.navigate(['/tabs/home']);
    }
  }

  onConfirmCancel() {
    this.showLocationAlert = false;
    this.router.navigate(['/tabs/home']);
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

  protected isFormValid(): boolean {
    return !!(
      this.poiName.trim() &&
      this.poiDescription.trim() &&
      this.selectedImageType &&
      (
        (this.selectedImageType === 'url' && this.isValidImageUrl()) ||
        (this.selectedImageType === 'camera' && this.poiImageFromCamera)
      ) &&
      this.selectedLocation.latitude &&
      this.selectedLocation.longitude
    );
  }

  protected isValidImageUrl(): boolean {
    if (!this.poiImageUrl.trim()) return false;
    return this.customPoiService.isValidImageUrl(this.poiImageUrl.trim());
  }

  private showToastMessage(message: string, color: 'success' | 'warning' | 'danger') {
    this.toastMessage = message;
    this.toastColor = color;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  // Getters para el template
  get nameCharacterCount(): number {
    return this.poiName.length;
  }

  get descriptionCharacterCount(): number {
    return this.poiDescription.length;
  }

  get isNameValid(): boolean {
    return this.poiName.trim().length > 0 && this.poiName.length <= this.nameMaxLength;
  }

  get isDescriptionValid(): boolean {
    return this.poiDescription.trim().length > 0 && this.poiDescription.length <= this.descriptionMaxLength;
  }

  get selectedImage(): string {
    return this.selectedImageType === 'camera' 
      ? this.poiImageFromCamera 
      : this.poiImageUrl;
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

  // Action Sheet buttons
  get imageActionSheetButtons() {
    return [
      {
        text: 'Tomar foto',
        icon: 'camera',
        handler: () => this.onImageTypeSelected('camera')
      },
      {
        text: 'URL de imagen',
        icon: 'image',
        handler: () => this.onImageTypeSelected('url')
      },
      {
        text: 'Cancelar',
        icon: 'close',
        role: 'cancel'
      }
    ];
  }

  // Alert buttons
  get cancelAlertButtons() {
    return [
      {
        text: 'Continuar editando',
        role: 'cancel'
      },
      {
        text: 'Descartar cambios',
        handler: () => this.onConfirmCancel()
      }
    ];
  }
}