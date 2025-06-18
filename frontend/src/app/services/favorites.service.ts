import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpService } from './http.service';
import { AuthService } from './auth.service';
import { catchError, map, tap } from 'rxjs/operators';

export interface FavoritePoi {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  distance: string;
  estimatedTime: string;
  isFavorite: boolean;
  poiType: 'foursquare' | 'custom';
  savedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private httpService = inject(HttpService);
  private authService = inject(AuthService);

  private favoritesSubject = new BehaviorSubject<FavoritePoi[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();

  // Cache local para verificación rápida
  private favoriteIds = new Set<string>();

  constructor() {
    console.log('FavoritesService: Inicializando servicio de favoritos');
    
    // CORREGIR: Escuchar cambios de autenticación desde AuthService
    this.authService.currentUser$.subscribe(user => {
      console.log('FavoritesService: Estado de usuario cambió:', user ? user.name : 'No loggeado');
      
      if (user) {
        console.log('FavoritesService: Usuario loggeado, cargando favoritos');
        this.loadUserFavorites();
      } else {
        console.log('FavoritesService: Usuario desloggeado, limpiando favoritos');
        this.clearFavorites();
      }
    });
  }

  // Cargar favoritos del usuario
  loadUserFavorites(): void {
    // CORREGIR: Usar AuthService para obtener usuario actual
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.log('FavoritesService: No hay usuario actual para cargar favoritos');
      return;
    }

    console.log('FavoritesService: Cargando favoritos del servidor para:', currentUser.name);

    this.httpService.getUserFavorites().subscribe({
      next: (favorites) => {
        console.log(`FavoritesService: ${favorites.length} favoritos recibidos del servidor:`, favorites);
        
        const formattedFavorites = favorites.map(fav => ({
          ...fav,
          savedAt: new Date(fav.savedAt)
        }));
        
        this.favoritesSubject.next(formattedFavorites);
        
        // Actualizar cache de IDs
        this.favoriteIds.clear();
        favorites.forEach(fav => this.favoriteIds.add(fav.id));
        
        console.log('FavoritesService: IDs en cache:', Array.from(this.favoriteIds));
      },
      error: (error) => {
        console.error('FavoritesService: Error cargando favoritos:', error);
        this.favoritesSubject.next([]);
        this.favoriteIds.clear();
      }
    });
  }

  // Toggle favorito - CORREGIDO
  toggleFavorite(poiData: {
    id: string;
    name: string;
    description: string;
    image: string;
    category: string;
    latitude: number;
    longitude: number;
    rating: number;
    isCustom?: boolean;
  }): Observable<{ success: boolean; isFavorite: boolean; message: string }> {
    
    console.log('=== INICIO TOGGLE FAVORITO ===');
    console.log('FavoritesService: POI:', poiData.name, 'ID:', poiData.id);
    
    // CORREGIR: Usar AuthService para verificar autenticación
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.log('FavoritesService: ❌ Usuario no autenticado');
      return of({
        success: false,
        isFavorite: false,
        message: 'Debes iniciar sesión para guardar favoritos'
      });
    }

    console.log('FavoritesService: ✅ Usuario autenticado:', currentUser.name, 'ID:', currentUser.id);

    // Preparar datos para el backend
    const favoriteData = {
      poiId: poiData.id,
      poiData: {
        name: poiData.name,
        description: poiData.description,
        image: poiData.image,
        category: poiData.category,
        latitude: poiData.latitude,
        longitude: poiData.longitude,
        rating: poiData.rating,
        poiType: (poiData.isCustom ? 'custom' : 'foursquare') as 'foursquare' | 'custom'
      }
    };

    console.log('FavoritesService: 📤 Enviando al backend:', favoriteData);

    return this.httpService.toggleFavorite(favoriteData).pipe(
      tap(response => {
        console.log('FavoritesService: 📥 Respuesta del backend:', response);
        
        if (response.success) {
          console.log('FavoritesService: ✅ Toggle exitoso, isFavorite:', response.isFavorite);
          
          // Actualizar cache local
          if (response.isFavorite) {
            this.favoriteIds.add(poiData.id);
            console.log('FavoritesService: ➕ Añadido al cache local');
          } else {
            this.favoriteIds.delete(poiData.id);
            console.log('FavoritesService: ➖ Eliminado del cache local');
          }
          
          console.log('FavoritesService: 📋 Cache actual:', Array.from(this.favoriteIds));
          
          // Recargar favoritos para sincronizar
          console.log('FavoritesService: 🔄 Recargando favoritos...');
          setTimeout(() => this.loadUserFavorites(), 1000);
        } else {
          console.log('FavoritesService: ❌ Toggle falló:', response.message);
        }
      }),
      map(response => ({
        success: response.success,
        isFavorite: response.isFavorite || false,
        message: response.message || 'Error desconocido'
      })),
      catchError(error => {
        console.error('FavoritesService: 💥 Error en toggle:', error);
        return of({
          success: false,
          isFavorite: this.isFavorite(poiData.id),
          message: 'Error de conexión'
        });
      }),
      tap(() => {
        console.log('=== FIN TOGGLE FAVORITO ===');
      })
    );
  }

  // Verificar si un POI es favorito (cache local)
  isFavorite(poiId: string): boolean {
    const result = this.favoriteIds.has(poiId);
    console.log(`FavoritesService: Verificar favorito ${poiId}:`, result);
    return result;
  }

  // Verificar favorito desde servidor - CORREGIDO
  checkFavorite(poiId: string): Observable<boolean> {
    console.log('FavoritesService: Verificando favorito en servidor:', poiId);
    
    // CORREGIR: Usar AuthService
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.log('FavoritesService: No hay usuario para verificar favorito');
      return of(false);
    }

    return this.httpService.checkFavorite(poiId).pipe(
      map(response => response.isFavorite),
      tap(isFavorite => {
        console.log(`FavoritesService: POI ${poiId} es favorito (servidor):`, isFavorite);
        // Actualizar cache local
        if (isFavorite) {
          this.favoriteIds.add(poiId);
        } else {
          this.favoriteIds.delete(poiId);
        }
      }),
      catchError(error => {
        console.error('FavoritesService: Error verificando favorito:', error);
        return of(false);
      })
    );
  }

  // Obtener favoritos del usuario
  getUserFavorites(): Observable<FavoritePoi[]> {
    return this.favorites$;
  }

  // Limpiar favoritos (logout)
  private clearFavorites(): void {
    console.log('FavoritesService: Limpiando favoritos (logout)');
    this.favoritesSubject.next([]);
    this.favoriteIds.clear();
  }

  // Método para sincronizar estado de favoritos en POIs
  syncFavoriteStatus(pois: any[]): any[] {
    return pois.map(poi => ({
      ...poi,
      isFavorite: this.isFavorite(poi.id)
    }));
  }
}