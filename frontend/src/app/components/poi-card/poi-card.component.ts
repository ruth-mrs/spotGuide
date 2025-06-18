import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardContent, IonButton, IonIcon, IonChip, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { star, starOutline, heart, heartOutline, location, time, eye, create, trash } from 'ionicons/icons';

export interface POI {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
  distance: string;
  estimatedTime: string;
  latitude: number;
  longitude: number;
  isFavorite: boolean;
}

@Component({
  selector: 'app-poi-card',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonChip,
    IonLabel
  ],
  templateUrl: './poi-card.component.html',
  styleUrls: ['./poi-card.component.scss']
})
export class PoiCardComponent {
  @Input() poi!: POI;
  @Output() cardClick = new EventEmitter<POI>();
  @Output() favoriteToggle = new EventEmitter<POI>();
  @Output() viewDetails = new EventEmitter<POI>(); 
  @Output() editPoi = new EventEmitter<POI>(); // Nuevo evento
  @Output() deletePoi = new EventEmitter<POI>(); // Nuevo evento
  @Input() showActions: boolean = false;

  constructor() {
    addIcons({
      star,
      starOutline,
      heart,
      heartOutline,
      location,
      time,
      eye,
      create, // Añadir icono de editar
      trash
    });
  }

  onCardClick(event: Event) {
    // Prevenir propagación para evitar conflictos
    event.stopPropagation();
    console.log('PoiCardComponent: Card click para:', this.poi.name);
    this.cardClick.emit(this.poi);
  }

  onFavoriteClick(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    
    console.log('PoiCardComponent: Favorite click para:', this.poi.name);
    this.favoriteToggle.emit(this.poi);
  }

  onEditClick(event: Event) {
    event.stopPropagation();
    this.editPoi.emit(this.poi);
  }

  onDeleteClick(event: Event) {
    event.stopPropagation();
    this.deletePoi.emit(this.poi);
  }

  onViewDetails(event: Event) {
    event.stopPropagation();
    this.viewDetails.emit(this.poi);
  }

  getRatingStars(): number[] {
    return Array(5).fill(0).map((_, i) => i);
  }
}