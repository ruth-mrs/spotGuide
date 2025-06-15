import { Injectable } from '@angular/core';
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
  private favoritesSubject = new BehaviorSubject<FavoritePoi[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();

  // Cache local para verificación rápida
  private favoriteIds = new Set<string>();

  constructor(
    private httpService: HttpService,
    private authService: AuthService
  ) {
    // Cargar favoritos al inicializar si hay usuario
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.loadUserFavorites();
      } else {
        this.clearFavorites();
      }
    });
  }

  // Cargar favoritos del usuario
  loadUserFavorites(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.httpService.getUserFavorites().subscribe({
      next: (favorites) => {
        const formattedFavorites = favorites.map(fav => ({
          ...fav,
          savedAt: new Date(fav.savedAt)
        }));
        
        this.favoritesSubject.next(formattedFavorites);
        this.favoriteIds = new Set(favorites.map(f => f.id));
        
        console.log(`FavoritesService: ${favorites.length} favoritos cargados`);
      },
      error: (error) => {
        console.error('FavoritesService: Error cargando favoritos:', error);
        this.favoritesSubject.next([]);
        this.favoriteIds.clear();
      }
    });
  }

  // Toggle favorito
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
    
    if (!this.authService.isLoggedIn()) {
      return of({
        success: false,
        isFavorite: false,
        message: 'Debes iniciar sesión para guardar favoritos'
      });
    }

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

    return this.httpService.toggleFavorite(favoriteData).pipe(
      tap(response => {
        if (response.success) {
          if (response.isFavorite) {
            this.favoriteIds.add(poiData.id);
          } else {
            this.favoriteIds.delete(poiData.id);
          }
          // Recargar favoritos para mantener sincronización
          this.loadUserFavorites();
        }
      }),
      map(response => ({
        success: response.success,
        isFavorite: response.isFavorite || false,
        message: response.message
      })),
      catchError(error => {
        console.error('FavoritesService: Error toggle favorito:', error);
        return of({
          success: false,
          isFavorite: false,
          message: error.message || 'Error actualizando favorito'
        });
      })
    );
  }

  // Verificar si un POI es favorito
  isFavorite(poiId: string): boolean {
    return this.favoriteIds.has(poiId);
  }

  // Verificar favorito desde servidor
  checkFavorite(poiId: string): Observable<boolean> {
    if (!this.authService.isLoggedIn()) {
      return of(false);
    }

    return this.httpService.checkFavorite(poiId).pipe(
      map(response => response.isFavorite),
      tap(isFavorite => {
        if (isFavorite) {
          this.favoriteIds.add(poiId);
        } else {
          this.favoriteIds.delete(poiId);
        }
      }),
      catchError(() => of(false))
    );
  }

  // Obtener favoritos del usuario
  getUserFavorites(): Observable<FavoritePoi[]> {
    return this.favorites$;
  }

  // Limpiar favoritos (logout)
  private clearFavorites(): void {
    this.favoritesSubject.next([]);
    this.favoriteIds.clear();
  }
}