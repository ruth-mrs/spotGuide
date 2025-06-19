import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { HttpService } from './http.service';
import { AuthService } from './auth.service';
import { catchError, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

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
    private authService: AuthService,
    private http: HttpClient
  ) {}

  // ✅ CORREGIR: Obtener POIs públicos del backend
  getPublicCustomPois(): Observable<CustomPOI[]> {
    return this.http.get<any>(`${environment.apiUrl}/custom-pois/public`).pipe(
      map(response => {
        console.log('CustomPoiService: POIs públicos del backend:', response);
        
        // El backend devuelve { success: true, pois: [...] } o directamente [...]
        const pois = response.pois || response;
        
        return pois.map((poi: any) => ({
          id: poi.id,
          name: poi.name,
          description: poi.description,
          category: poi.category,
          image: poi.image || '',
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
          isCustom: true as const,
          isPublic: poi.isPublic !== false,
          totalFavorites: poi.totalFavorites || 0
        }));
      }),
      catchError(error => {
        console.error('CustomPoiService: Error obteniendo POIs públicos:', error);
        return of([]);
      })
    );
  }

  // ✅ CORREGIR: Obtener POIs del usuario (local storage o backend)
  private getUserLocalPois(): CustomPOI[] {
    // Si tienes POIs en localStorage, los obtienes aquí
    // Si no, devuelves array vacío
    try {
      const stored = localStorage.getItem('customPois');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error cargando POIs locales:', error);
    }
    return [];
  }

  // ✅ CORREGIR: Combinar POIs locales + backend
  getAllCustomPois(): Observable<CustomPOI[]> {
    return forkJoin([
      of(this.getUserLocalPois()), // ✅ POIs locales (array)
      this.getPublicCustomPois()   // ✅ POIs del backend (Observable)
    ]).pipe(
      map(([localPois, backendPois]) => {
        console.log(`CustomPoiService: Combinando ${localPois.length} locales + ${backendPois.length} backend`);
        
        // Evitar duplicados usando ID
        const seenIds = new Set<string>();
        const combinedPois: CustomPOI[] = [];
        
        // ✅ Primero los locales (prioridad)
        localPois.forEach(poi => {
          if (!seenIds.has(poi.id)) {
            seenIds.add(poi.id);
            combinedPois.push(poi);
          }
        });
        
        // ✅ Luego los del backend
        backendPois.forEach(poi => {
          if (!seenIds.has(poi.id)) {
            seenIds.add(poi.id);
            combinedPois.push(poi);
          }
        });
        
        console.log(`CustomPoiService: ${combinedPois.length} POIs únicos combinados`);
        return combinedPois;
      })
    );
  }

  // ✅ ALIAS para compatibilidad
  getCustomPois(): Observable<CustomPOI[]> {
    return this.getAllCustomPois();
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

  // ✅ CORREGIR: Búsqueda de POIs personalizados
  searchCustomPois(query: string, userLatitude?: number, userLongitude?: number): Observable<CustomPOI[]> {
    return this.getAllCustomPois().pipe(
      map(allPois => {
        const normalizedQuery = query.toLowerCase().trim();
        
        let results = allPois.filter(poi => 
          poi.isPublic && (
            poi.name.toLowerCase().includes(normalizedQuery) ||
            poi.description.toLowerCase().includes(normalizedQuery) ||
            poi.category.toLowerCase().includes(normalizedQuery)
          )
        );

        // Ordenar por distancia si se proporciona ubicación del usuario
        if (userLatitude && userLongitude) {
          results.sort((a, b) => {
            const distanceA = this.calculateDistance(userLatitude, userLongitude, a.latitude, a.longitude);
            const distanceB = this.calculateDistance(userLatitude, userLongitude, b.latitude, b.longitude);
            return distanceA - distanceB;
          });
        }

        return results;
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

  async getCurrentPosition(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
    } catch (error: any) {
      throw new Error(`Error obteniendo ubicación: ${error.message || error}`);
    }
  }

  async takePicture(): Promise<string> {
  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera // Usa la cámara directamente
    });
    if (image && image.dataUrl) {
      return image.dataUrl;
    } else {
      throw new Error('No se pudo obtener la imagen de la cámara');
    }
  } catch (error: any) {
    throw new Error('Error al tomar la foto: ' + (error.message || error));
  }
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