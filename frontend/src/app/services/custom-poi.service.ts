import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
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
  // Datos específicos de POI personalizado
  userId: string;
  userName: string;
  createdAt: Date;
  createdFromLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  isCustom: true;
  // NUEVOS CAMPOS PARA GESTIÓN COMPARTIDA
  isPublic: boolean; // Indica si es visible para todos
  totalFavorites: number; // Contador global de favoritos
  favoritedBy: string[]; // IDs de usuarios que lo marcaron como favorito
}

@Injectable({
  providedIn: 'root'
})
export class CustomPoiService {
  private readonly STORAGE_KEY = 'spotguide_custom_pois_shared'; // CAMBIAR NOMBRE DE CLAVE
  private readonly USER_FAVORITES_KEY = 'spotguide_user_favorites'; // Nueva clave para favoritos por usuario
  private customPois: CustomPOI[] = [];
  private customPoisSubject = new BehaviorSubject<CustomPOI[]>([]);
  public customPois$ = this.customPoisSubject.asObservable();

  // Simulación de usuario actual (integrar con servicio de autenticación real)
  private currentUserId = 'user123'; // TODO: Obtener desde servicio de auth

  constructor() {
    this.loadFromStorage();
  }

  // NUEVO: Establecer usuario actual (para cuando se integre la autenticación)
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
    this.loadFromStorage(); // Recargar para actualizar favoritos del usuario actual
  }

  // Obtener POIs personalizados PÚBLICOS (visibles para todos)
  getCustomPois(): Observable<CustomPOI[]> {
    return this.customPoisSubject.asObservable();
  }

  // Obtener todos los POIs personalizados públicos (sincrónico)
  getAllCustomPois(): CustomPOI[] {
    return this.customPois.filter(poi => poi.isPublic);
  }

  // Obtener POI personalizado por ID (público)
  getCustomPoiById(id: string): CustomPOI | null {
    const poi = this.customPois.find(poi => poi.id === id);
    return (poi && poi.isPublic) ? poi : null;
  }

  // NUEVO: Verificar si el usuario actual puede editar/eliminar un POI
  canUserEditPoi(poiId: string): boolean {
    const poi = this.customPois.find(p => p.id === poiId);
    return poi ? poi.userId === this.currentUserId : false;
  }

  // NUEVO: Verificar si el usuario actual es el creador del POI
  isPoiCreatedByCurrentUser(poiId: string): boolean {
    return this.canUserEditPoi(poiId);
  }

  // Tomar foto con la cámara
  async takePicture(): Promise<string> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 800,
        height: 600,
        correctOrientation: true
      });

      if (image.dataUrl) {
        console.log('CustomPoiService: Foto tomada exitosamente');
        return image.dataUrl;
      } else {
        throw new Error('No se pudo obtener la imagen');
      }
    } catch (error) {
      console.error('CustomPoiService: Error tomando foto:', error);
      throw error;
    }
  }

  // Obtener ubicación actual
  async getCurrentPosition(): Promise<{ latitude: number; longitude: number; accuracy?: number }> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      console.log('CustomPoiService: Ubicación obtenida:', location);
      return location;
    } catch (error) {
      console.error('CustomPoiService: Error obteniendo ubicación:', error);
      // Fallback a ubicación por defecto (Almería)
      return {
        latitude: 36.8377,
        longitude: -2.4585,
        accuracy: undefined
      };
    }
  }

  // Calcular distancia entre dos puntos
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Formatear distancia
  private formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    } else {
      return `${distanceKm.toFixed(1)} km`;
    }
  }

  // Calcular tiempo estimado
  private calculateEstimatedTime(distanceKm: number): string {
    const walkingSpeedKmh = 4; // 4 km/h velocidad promedio caminando
    const timeHours = distanceKm / walkingSpeedKmh;
    
    if (timeHours < 1) {
      const minutes = Math.round(timeHours * 60);
      return `${minutes} min andando`;
    } else {
      const hours = Math.floor(timeHours);
      const minutes = Math.round((timeHours - hours) * 60);
      return minutes > 0 ? `${hours}h ${minutes}min andando` : `${hours}h andando`;
    }
  }

  // Añadir POI personalizado PÚBLICO
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
    try {
      // Obtener ubicación actual si no se proporciona
      const createdFromLocation = currentUserLocation || await this.getCurrentPosition();

      // Calcular distancia desde la ubicación actual
      const distanceKm = this.calculateDistance(
        createdFromLocation.latitude,
        createdFromLocation.longitude,
        latitude,
        longitude
      );

      const customPoi: CustomPOI = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        description: description.trim(),
        category,
        image,
        imageType,
        latitude,
        longitude,
        rating: 0,
        reviewCount: 0,
        distance: this.formatDistance(distanceKm),
        estimatedTime: this.calculateEstimatedTime(distanceKm),
        isFavorite: false, // Se calculará dinámicamente basado en favoritedBy
        userId,
        userName,
        createdAt: new Date(),
        createdFromLocation,
        isCustom: true,
        // NUEVOS CAMPOS
        isPublic: true, // Por defecto, todos los POIs son públicos
        totalFavorites: 0,
        favoritedBy: []
      };

      // Añadir al array
      this.customPois.unshift(customPoi);
      
      // Guardar en storage
      this.saveToStorage();
      
      // Actualizar favoritos del usuario actual
      this.updateUserFavoriteStatus();
      
      // Emitir cambios
      this.customPoisSubject.next([...this.customPois]);

      console.log(`CustomPoiService: POI personalizado público "${name}" añadido exitosamente`);
      return customPoi;
    } catch (error) {
      console.error('CustomPoiService: Error añadiendo POI personalizado:', error);
      throw error;
    }
  }

  // Actualizar distancias desde una nueva ubicación
  updateDistancesFromLocation(userLatitude: number, userLongitude: number): void {
    let updated = false;

    this.customPois = this.customPois.map(poi => {
      const distanceKm = this.calculateDistance(userLatitude, userLongitude, poi.latitude, poi.longitude);
      const newDistance = this.formatDistance(distanceKm);
      const newEstimatedTime = this.calculateEstimatedTime(distanceKm);

      if (poi.distance !== newDistance) {
        updated = true;
        return {
          ...poi,
          distance: newDistance,
          estimatedTime: newEstimatedTime
        };
      }
      return poi;
    });

    if (updated) {
      this.saveToStorage();
      this.customPoisSubject.next([...this.customPois]);
      console.log('CustomPoiService: Distancias actualizadas para POIs personalizados');
    }
  }

  // MODIFICADO: Eliminar POI personalizado (solo el creador)
  deleteCustomPoi(poiId: string, userId?: string): boolean {
    const userIdToCheck = userId || this.currentUserId;
    const index = this.customPois.findIndex(poi => poi.id === poiId && poi.userId === userIdToCheck);
    
    if (index > -1) {
      const deletedPoi = this.customPois.splice(index, 1)[0];
      
      // Limpiar de favoritos de todos los usuarios
      this.removePoiFromAllUserFavorites(poiId);
      
      this.saveToStorage();
      this.updateUserFavoriteStatus();
      this.customPoisSubject.next([...this.customPois]);
      
      console.log(`CustomPoiService: POI personalizado "${deletedPoi.name}" eliminado por su creador`);
      return true;
    }
    
    console.warn(`CustomPoiService: No se pudo eliminar POI ${poiId}. Solo el creador puede eliminarlo.`);
    return false;
  }

  // MODIFICADO: Actualizar POI personalizado (solo el creador)
  updateCustomPoi(
    poiId: string, 
    updates: Partial<Pick<CustomPOI, 'name' | 'description' | 'category' | 'image' | 'imageType' | 'latitude' | 'longitude'>>,
    userId?: string
  ): boolean {
    const userIdToCheck = userId || this.currentUserId;
    const index = this.customPois.findIndex(poi => poi.id === poiId && poi.userId === userIdToCheck);
    
    if (index > -1) {
      this.customPois[index] = { ...this.customPois[index], ...updates };
      this.saveToStorage();
      this.updateUserFavoriteStatus();
      this.customPoisSubject.next([...this.customPois]);
      console.log(`CustomPoiService: POI personalizado "${this.customPois[index].name}" actualizado por su creador`);
      return true;
    }
    
    console.warn(`CustomPoiService: No se pudo actualizar POI ${poiId}. Solo el creador puede editarlo.`);
    return false;
  }

  // MODIFICADO: Obtener POIs del usuario (solo los creados por él)
  getUserCustomPois(userId: string): CustomPOI[] {
    return this.customPois.filter(poi => poi.userId === userId && poi.isPublic);
  }

  // Buscar POIs personalizados públicos por texto
  searchCustomPois(query: string, userLatitude?: number, userLongitude?: number): CustomPOI[] {
    const normalizedQuery = query.toLowerCase().trim();
    
    let results = this.customPois.filter(poi => 
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
  }

  // Validar URL de imagen
  isValidImageUrl(url: string): boolean {
    try {
      const validUrl = new URL(url);
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const hasValidExtension = validExtensions.some(ext => 
        validUrl.pathname.toLowerCase().includes(ext)
      );
      
      return validUrl.protocol === 'http:' || validUrl.protocol === 'https:' || hasValidExtension;
    } catch {
      return false;
    }
  }

  // MODIFICADO: Toggle favorito para cualquier usuario
  toggleFavorite(poiId: string, userId?: string): boolean {
    try {
      const userIdToCheck = userId || this.currentUserId;
      const poiIndex = this.customPois.findIndex(poi => poi.id === poiId);
      
      if (poiIndex === -1) {
        console.error('CustomPoiService: POI no encontrado para toggle favorite:', poiId);
        return false;
      }

      const poi = this.customPois[poiIndex];
      const userFavoriteIndex = poi.favoritedBy.indexOf(userIdToCheck);

      if (userFavoriteIndex > -1) {
        // Remover de favoritos
        poi.favoritedBy.splice(userFavoriteIndex, 1);
        poi.totalFavorites = Math.max(0, poi.totalFavorites - 1);
        console.log(`CustomPoiService: ${userIdToCheck} removió "${poi.name}" de favoritos`);
      } else {
        // Añadir a favoritos
        poi.favoritedBy.push(userIdToCheck);
        poi.totalFavorites = poi.favoritedBy.length;
        console.log(`CustomPoiService: ${userIdToCheck} añadió "${poi.name}" a favoritos`);
      }

      // Actualizar estado isFavorite para el usuario actual
      poi.isFavorite = poi.favoritedBy.includes(this.currentUserId);

      // Guardar cambios
      this.saveToStorage();
      this.saveUserFavorites();
      
      // Emitir cambios
      this.customPoisSubject.next([...this.customPois]);

      return true;

    } catch (error) {
      console.error('CustomPoiService: Error toggling favorite:', error);
      return false;
    }
  }

  // NUEVO: Obtener estadísticas de un POI
  getPoiStats(poiId: string): { totalFavorites: number; isFavorite: boolean; canEdit: boolean } | null {
    const poi = this.customPois.find(p => p.id === poiId);
    
    if (!poi || !poi.isPublic) {
      return null;
    }

    return {
      totalFavorites: poi.totalFavorites,
      isFavorite: poi.favoritedBy.includes(this.currentUserId),
      canEdit: poi.userId === this.currentUserId
    };
  }

  // NUEVO: Obtener POIs más populares (por número de favoritos)
  getPopularCustomPois(limit: number = 10): CustomPOI[] {
    return this.customPois
      .filter(poi => poi.isPublic)
      .sort((a, b) => b.totalFavorites - a.totalFavorites)
      .slice(0, limit);
  }

  // NUEVO: Obtener POIs favoritos del usuario actual
  getUserFavoriteCustomPois(): CustomPOI[] {
    return this.customPois.filter(poi => 
      poi.isPublic && poi.favoritedBy.includes(this.currentUserId)
    );
  }

  private loadFromStorage(): void {
    try {
      const customPoisData = localStorage.getItem(this.STORAGE_KEY);
      
      if (customPoisData) {
        const parsedData = JSON.parse(customPoisData);
        this.customPois = parsedData.map((poi: any) => ({
          ...poi,
          createdAt: new Date(poi.createdAt),
          // Asegurar que los nuevos campos existan
          isPublic: poi.isPublic !== undefined ? poi.isPublic : true,
          totalFavorites: poi.totalFavorites || 0,
          favoritedBy: poi.favoritedBy || []
        }));
        
        console.log(`CustomPoiService: Cargados ${this.customPois.length} POIs personalizados compartidos desde storage`);
        
        // Actualizar estado de favoritos para el usuario actual
        this.updateUserFavoriteStatus();
        this.customPoisSubject.next([...this.customPois]);
      }
    } catch (error) {
      console.error('CustomPoiService: Error cargando POIs personalizados desde storage:', error);
      this.customPois = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.customPois));
      console.log(`CustomPoiService: ${this.customPois.length} POIs personalizados compartidos guardados en storage`);
    } catch (error) {
      console.error('CustomPoiService: Error guardando POIs personalizados en storage:', error);
    }
  }

  // NUEVO: Actualizar estado de favoritos para el usuario actual
  private updateUserFavoriteStatus(): void {
    this.customPois.forEach(poi => {
      poi.isFavorite = poi.favoritedBy.includes(this.currentUserId);
    });
  }

  // NUEVO: Guardar favoritos del usuario actual por separado (para backup)
  private saveUserFavorites(): void {
    try {
      const userFavorites = this.customPois
        .filter(poi => poi.favoritedBy.includes(this.currentUserId))
        .map(poi => poi.id);
      
      const allUserFavorites = this.getUserFavoritesFromStorage();
      allUserFavorites[this.currentUserId] = userFavorites;
      
      localStorage.setItem(this.USER_FAVORITES_KEY, JSON.stringify(allUserFavorites));
    } catch (error) {
      console.error('CustomPoiService: Error guardando favoritos del usuario:', error);
    }
  }

  // NUEVO: Obtener favoritos por usuario desde storage
  private getUserFavoritesFromStorage(): { [userId: string]: string[] } {
    try {
      const favoritesData = localStorage.getItem(this.USER_FAVORITES_KEY);
      return favoritesData ? JSON.parse(favoritesData) : {};
    } catch (error) {
      console.error('CustomPoiService: Error cargando favoritos de usuarios:', error);
      return {};
    }
  }

  // NUEVO: Remover POI de favoritos de todos los usuarios
  private removePoiFromAllUserFavorites(poiId: string): void {
    try {
      const allUserFavorites = this.getUserFavoritesFromStorage();
      
      Object.keys(allUserFavorites).forEach(userId => {
        allUserFavorites[userId] = allUserFavorites[userId].filter(id => id !== poiId);
      });
      
      localStorage.setItem(this.USER_FAVORITES_KEY, JSON.stringify(allUserFavorites));
    } catch (error) {
      console.error('CustomPoiService: Error removiendo POI de favoritos de usuarios:', error);
    }
  }

  // Limpiar todos los POIs personalizados (para desarrollo/testing)
  clearAllCustomPois(): void {
    this.customPois = [];
    this.saveToStorage();
    localStorage.removeItem(this.USER_FAVORITES_KEY);
    this.customPoisSubject.next([]);
    console.log('CustomPoiService: Todos los POIs personalizados y favoritos eliminados');
  }

  // NUEVO: Obtener estadísticas generales
  getGeneralStats(): {
    totalCustomPois: number;
    totalPublicPois: number;
    userCreatedPois: number;
    userFavoritePois: number;
    mostPopularPoi?: CustomPOI;
  } {
    const publicPois = this.customPois.filter(poi => poi.isPublic);
    const userCreatedPois = this.customPois.filter(poi => poi.userId === this.currentUserId && poi.isPublic);
    const userFavoritePois = this.getUserFavoriteCustomPois();
    const mostPopularPoi = publicPois.reduce((prev, current) => 
      (prev.totalFavorites > current.totalFavorites) ? prev : current, publicPois[0]
    );

    return {
      totalCustomPois: this.customPois.length,
      totalPublicPois: publicPois.length,
      userCreatedPois: userCreatedPois.length,
      userFavoritePois: userFavoritePois.length,
      mostPopularPoi
    };
  }
}