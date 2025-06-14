import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  description?: string;
  category?: string;
  rating?: number;
  distance?: string;
  icon?: string;
  isSelected?: boolean;
  isCustom?: boolean; 
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  @Input() center: { lat: number; lng: number } = { lat: 36.8377, lng: -2.4585 }; // Almería
  @Input() zoom: number = 13;
  @Input() markers: MapMarker[] = [];
  @Input() height: string = '100%';
  
  @Output() mapClick = new EventEmitter<{ lat: number; lng: number }>();
  @Output() markerClick = new EventEmitter<MapMarker>();

  private map: L.Map | undefined;
  private leafletMarkers: L.Marker[] = [];

  // Iconos personalizados para los marcadores
  private defaultIcon = L.divIcon({
    html: `
      <div class="custom-marker">
        <div class="marker-pin"></div>
      </div>
    `,
    className: 'custom-marker-container',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40]
  });

  private selectedIcon = L.divIcon({
    html: `
      <div class="custom-marker selected">
        <div class="marker-pin selected"></div>
      </div>
    `,
    className: 'custom-marker-container',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40]
  });

  private customIcon = L.divIcon({
  html: `
    <div class="custom-marker custom-poi">
      <div class="marker-pin">
        <div class="marker-icon">⭐</div>
      </div>
    </div>
  `,
  className: 'custom-marker-wrapper',
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

private selectedCustomIcon = L.divIcon({
  html: `
    <div class="custom-marker custom-poi selected">
      <div class="marker-pin">
        <div class="marker-icon">⭐</div>
      </div>
      <div class="marker-pulse"></div>
    </div>
  `,
  className: 'custom-marker-wrapper',
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

  ngOnInit() {
    // Configurar iconos por defecto de Leaflet
    this.fixLeafletIcons();
  }

  ngAfterViewInit() {
  // Pequeño delay para asegurar que el DOM esté listo
  setTimeout(() => {
    this.initializeMap();
    
    // Si ya tenemos marcadores, añadirlos
    if (this.markers.length > 0) {
      console.log('MapComponent: Añadiendo marcadores después de inicializar');
      setTimeout(() => {
        this.updateMarkers(this.markers);
      }, 500);
    }
  }, 200);
}

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private fixLeafletIcons() {
    // Fix para los iconos por defecto de Leaflet en Angular
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
    });
  }

  private initializeMap() {
    if (this.map) {
      this.map.remove();
    }

    // Crear el mapa
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [this.center.lat, this.center.lng],
      zoom: this.zoom,
      zoomControl: false, // Desactivar controles por defecto
      attributionControl: false // Ocultar atribución por defecto
    });

    // Añadir capa de tiles (mapa base)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Añadir controles de zoom personalizados
    this.addCustomZoomControls();

    // Añadir evento de click en el mapa
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.mapClick.emit({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    });

    // Añadir marcadores
    this.updateMarkers(this.markers);

    // Evento cuando el mapa está listo
    this.map.whenReady(() => {
      console.log('Mapa inicializado correctamente');
      if (this.map) {
        this.map.invalidateSize();
      }
    });
  }

  private addCustomZoomControls() {
    if (!this.map) return;

    // Crear controles de zoom personalizados
    const zoomControlDiv = L.DomUtil.create('div', 'custom-zoom-controls');
    
    const zoomInButton = L.DomUtil.create('button', 'zoom-btn zoom-in', zoomControlDiv);
    zoomInButton.innerHTML = '+';
    zoomInButton.type = 'button';
    
    const zoomOutButton = L.DomUtil.create('button', 'zoom-btn zoom-out', zoomControlDiv);
    zoomOutButton.innerHTML = '−';
    zoomOutButton.type = 'button';

    // Eventos para los botones
    L.DomEvent.on(zoomInButton, 'click', (e) => {
      L.DomEvent.stopPropagation(e);
      if (this.map) {
        this.map.zoomIn();
      }
    });

    L.DomEvent.on(zoomOutButton, 'click', (e) => {
      L.DomEvent.stopPropagation(e);
      if (this.map) {
        this.map.zoomOut();
      }
    });

    // Añadir al mapa en la esquina inferior izquierda
    const customControl = L.Control.extend({
      onAdd: () => zoomControlDiv,
      onRemove: () => {}
    });

    new customControl({ position: 'bottomleft' }).addTo(this.map);
  }

  updateMarkers(newMarkers: MapMarker[]) {
  console.log('MapComponent: Actualizando marcadores:', newMarkers.length);
  
  if (!this.map) {
    console.log('MapComponent: Mapa no inicializado, guardando marcadores');
    this.markers = newMarkers;
    return;
  }

  // Eliminar marcadores existentes
  this.leafletMarkers.forEach(marker => {
    this.map?.removeLayer(marker);
  });
  this.leafletMarkers = [];

  // Añadir nuevos marcadores
  newMarkers.forEach((markerData, index) => {
    let markerIcon;
    if (markerData.isCustom) {
      markerIcon = markerData.isSelected ? this.selectedCustomIcon : this.customIcon;
    } else {
      markerIcon = markerData.isSelected ? this.selectedIcon : this.defaultIcon;
    }

    const marker = L.marker(
      [markerData.position.lat, markerData.position.lng],
      { icon: markerIcon }
    );

    // Crear popup simple con título y botón
    const popupContent = this.createPopupContent(markerData);
    
    // Configurar popup con opciones específicas
    marker.bindPopup(popupContent, {
      maxWidth: 200,
      closeButton: true,
      autoClose: true,
      closeOnEscapeKey: true,
      className: 'simple-popup'
    });

    // Evento de click en el marcador - opcional para centrar
    marker.on('click', (e) => {
      console.log('MapComponent: Marcador clickeado:', markerData.title);
      // El popup se abre automáticamente, no necesitamos hacer nada más aquí
    });

    // Añadir al mapa
    marker.addTo(this.map!);
    this.leafletMarkers.push(marker);
  });

  this.markers = newMarkers;
  
  // Configurar función global para el botón "Ver detalles"
  (window as any).selectMarkerDetail = (markerId: string) => {
    console.log('MapComponent: Ver detalles clickeado para:', markerId);
    const marker = this.markers.find(m => m.id === markerId);
    if (marker) {
      // Cerrar todos los popups abiertos
      this.map?.closePopup();
      // Emitir evento para ir a detalles
      this.markerClick.emit(marker);
    }
  };

  console.log(`MapComponent: ${newMarkers.length} marcadores añadidos al mapa`);
}

  // Método para centrar el mapa en unas coordenadas
  centerMap(lat: number, lng: number, zoom?: number) {
    if (this.map) {
      this.map.setView([lat, lng], zoom || this.zoom);
    }
  }

  // Método para ajustar la vista a todos los marcadores
  fitBounds() {
    if (this.map && this.markers.length > 0) {
      const group = new L.FeatureGroup(this.leafletMarkers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  private createPopupContent(markerData: MapMarker): string {
  return `
    <div style="font-family: Arial, sans-serif; text-align: center; min-width: 150px;">
      <h4 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: 600;">
        ${markerData.title}
      </h4>
      
      <button 
        onclick="window.selectMarkerDetail('${markerData.id}')"
        style="
          background: #1976d2; 
          color: white; 
          border: none; 
          padding: 8px 16px; 
          border-radius: 6px; 
          cursor: pointer; 
          font-size: 12px;
          font-weight: 500;
          width: 100%;
          transition: background 0.2s ease;
        "
        onmouseover="this.style.background='#1565c0'"
        onmouseout="this.style.background='#1976d2'"
      >
        Ver detalles
      </button>
    </div>
  `;
}

}
