import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpService } from './http.service';
import { AuthService } from './auth.service';
import { catchError, map } from 'rxjs/operators';

export interface CustomPOI {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  imageType: 'url' | 'camera';
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  distance: string;
  estimatedTime: string;
  isFavorite: boolean;
  userId: string;
  userName: string;
  createdAt: Date;
  isCustom: true;
  isPublic: boolean;
  totalFavorites: number;
  canEdit?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CustomPoiService {
  constructor(
    private httpService: HttpService,
    private authService: AuthService
  ) {}

  // Obtener POIs públicos
  getPublicCustomPois(params?: {
    page?: number;
    limit?: number;
    lat?: number;
    lng?: number;
    radius?: number;
  }): Observable<CustomPOI[]> {
    return this.httpService.getPublicCustomPois(params).pipe(
      map(pois => pois.map(poi => this.formatCustomPoi(poi))),
      catchError(error => {
        console.error('CustomPoiService: Error obteniendo POIs públicos:', error);
        return of([]);
      })
    );
  }

  // Obtener POI por ID
  getCustomPoiById(id: string): Observable<CustomPOI | null> {
    return this.httpService.getCustomPoiById(id).pipe(
      map(poi => poi ? this.formatCustomPoi(poi) : null),
      catchError(error => {
        console.error('CustomPoiService: Error obteniendo POI:', error);
        return of(null);
      })
    );
  }

  async addCustomPoi(
  name: string,
  description: string,
  category: string,
  image: string,
  imageType: 'url' | 'camera',
  latitude: number,
  longitude: number,
  userId: string,
  userName: string,
  currentUserLocation?: { latitude: number; longitude: number }
): Promise<CustomPOI> {
  const poiData = {
    name: name.trim(),
    description: description.trim(),
    category,
    image,
    imageType,
    latitude,
    longitude,
    createdFromLocation: currentUserLocation
  };

  console.log('CustomPoiService: Creando POI con datos:', poiData);

  return new Promise((resolve, reject) => {
    this.httpService.createCustomPoi(poiData).subscribe({
      next: (response) => {
        if (response.success && response.poi) {
          const customPoi = this.formatCustomPoi(response.poi);
          console.log('CustomPoiService: POI creado exitosamente:', customPoi.name);
          resolve(customPoi);
        } else {
          reject(new Error(response.message || 'Error creando POI'));
        }
      },
      error: (error) => {
        console.error('CustomPoiService: Error creando POI:', error);
        reject(new Error(error.message || 'Error de conexión al crear POI'));
      }
    });
  });
}

  // Obtener POIs del usuario actual
  getUserCustomPois(userId?: string): Observable<CustomPOI[]> {
    if (!this.authService.isLoggedIn()) {
      return of([]);
    }

    return this.httpService.getUserCustomPois().pipe(
      map(pois => pois.map(poi => this.formatCustomPoi(poi))),
      catchError(error => {
        console.error('CustomPoiService: Error obteniendo POIs del usuario:', error);
        return of([]);
      })
    );
  }

  // Actualizar POI
  updateCustomPoi(id: string, updateData: Partial<CustomPOI>): Observable<{ success: boolean; message: string }> {
    return this.httpService.updateCustomPoi(id, updateData).pipe(
      map(response => ({
        success: response.success,
        message: response.message
      })),
      catchError(error => {
        console.error('CustomPoiService: Error actualizando POI:', error);
        return of({
          success: false,
          message: error.message || 'Error actualizando POI'
        });
      })
    );
  }

  // Eliminar POI
  deleteCustomPoi(id: string): Observable<{ success: boolean; message: string }> {
    return this.httpService.deleteCustomPoi(id).pipe(
      map(response => ({
        success: response.success,
        message: response.message
      })),
      catchError(error => {
        console.error('CustomPoiService: Error eliminando POI:', error);
        return of({
          success: false,
          message: error.message || 'Error eliminando POI'
        });
      })
    );
  }

  // Búsqueda de POIs personalizados
  searchCustomPois(query: string, latitude: number, longitude: number, page: number = 1, limit: number = 20): Observable<CustomPOI[]> {
    const params = {
      page,
      limit,
      lat: latitude,
      lng: longitude,
      radius: 10000 // 10km por defecto
    };

    return this.getPublicCustomPois(params).pipe(
      map(pois => {
        if (!query.trim()) return pois;
        
        const searchTerm = query.toLowerCase();
        return pois.filter(poi => 
          poi.name.toLowerCase().includes(searchTerm) ||
          poi.description.toLowerCase().includes(searchTerm) ||
          poi.category.toLowerCase().includes(searchTerm)
        );
      })
    );
  }

  // Actualizar distancias desde ubicación
  updateDistancesFromLocation(userLatitude: number, userLongitude: number, pois: CustomPOI[]): CustomPOI[] {
    return pois.map(poi => {
      const distance = this.calculateDistance(userLatitude, userLongitude, poi.latitude, poi.longitude);
      const estimatedTime = this.calculateEstimatedTime(distance);
      
      return {
        ...poi,
        distance: distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`,
        estimatedTime: `${estimatedTime} min`
      };
    });
  }

  // Obtener posición actual
  async getCurrentPosition(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(new Error(`Error obteniendo ubicación: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  // Tomar foto
  async takePicture(): Promise<string> {
    // Esta es una implementación simple. En una app real usarías Capacitor Camera
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            reject(new Error('Error leyendo la imagen'));
          };
          reader.readAsDataURL(file);
        } else {
          reject(new Error('No se seleccionó ninguna imagen'));
        }
      };
      
      input.click();
    });
  }

  // Validar URL de imagen
  isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    } catch {
      return false;
    }
  }

  // Formatear POI desde API
  private formatCustomPoi(poi: any): CustomPOI {
    const currentUser = this.authService.getCurrentUser();
    
    return {
      id: poi.id || poi._id,
      name: poi.name,
      description: poi.description,
      category: poi.category,
      image: poi.image,
      imageType: poi.imageType || 'url',
      latitude: poi.latitude,
      longitude: poi.longitude,
      rating: poi.rating || 0,
      reviewCount: poi.reviewCount || 0,
      distance: poi.distance || '0 km',
      estimatedTime: poi.estimatedTime || '0 min',
      isFavorite: poi.isFavorite || false,
      userId: poi.userId,
      userName: poi.userName,
      createdAt: new Date(poi.createdAt),
      isCustom: true,
      isPublic: poi.isPublic !== false,
      totalFavorites: poi.totalFavorites || 0,
      canEdit: currentUser ? poi.userId === currentUser.id : false
    };
  }

  // Calcular distancia entre dos puntos
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private calculateEstimatedTime(distanceKm: number): number {
    // Asumiendo velocidad promedio de caminata: 5 km/h
    const walkingSpeedKmh = 5;
    const timeHours = distanceKm / walkingSpeedKmh;
    return Math.round(timeHours * 60); // Convertir a minutos
  }

  // Obtener estadísticas generales
  getGeneralStats(): Observable<{
    totalCustomPois: number;
    totalPublicPois: number;
    userCreatedPois: number;
    userFavoritePois: number;
  }> {
    if (!this.authService.isLoggedIn()) {
      return of({
        totalCustomPois: 0,
        totalPublicPois: 0,
        userCreatedPois: 0,
        userFavoritePois: 0
      });
    }

    // Usar los datos ya cargados para calcular estadísticas
    return this.getUserCustomPois().pipe(
      map(userPois => {
        return {
          totalCustomPois: userPois.length,
          totalPublicPois: userPois.length,
          userCreatedPois: userPois.length,
          userFavoritePois: 0 // Se calculará desde FavoritesService
        };
      })
    );
  }
}