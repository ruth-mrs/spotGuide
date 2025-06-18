import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FoursquareService } from './foursquare.service';
import { POI } from '../components/poi-card/poi-card.component';
import { CustomPoiService, CustomPOI } from './custom-poi.service';
import { PaginatedResponse, SearchResponse, SearchLocation } from '../interfaces/search';
// Corregir el import - es FavoritePoi, no SavedPoi
import { FavoritePoi } from './favorites.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private foursquareService = inject(FoursquareService);
  private customPoiService = inject(CustomPoiService);
  private profileSearchSubject = new BehaviorSubject<string>('');
  public profileSearch$ = this.profileSearchSubject.asObservable();

  private lastSearchQuery: string = '';
  private lastSearchLocation: SearchLocation = { lat: 36.8377, lng: -2.4585 };

  performGlobalSearch(query: string, location?: SearchLocation): void {
    const searchLocation = location || this.lastSearchLocation;
    
    this.lastSearchQuery = query;
    this.lastSearchLocation = searchLocation;

    console.log(`SearchService: Realizando búsqueda global para "${query}" en`, searchLocation);
  }

  getSearchResults(
    query: string,
    latitude: number,
    longitude: number,
    page: number = 1,
    pageSize: number = 12
  ): Observable<PaginatedResponse> {
    console.log(`SearchService: Búsqueda con POIs personalizados - Query: "${query}", Página: ${page}`);

    // Obtener resultados de Foursquare
    const foursquareResults$ = query.trim() 
      ? this.foursquareService.globalSearchPaginated(query, latitude, longitude, page, pageSize)
      : this.foursquareService.searchNearbyPaginated(latitude, longitude, page, pageSize);

    return foursquareResults$.pipe(
      switchMap((foursquareResponse: PaginatedResponse) => {
        // Si no es la primera página, solo devolver resultados de Foursquare
        if (page > 1) {
          return of(foursquareResponse);
        }

        // Para la primera página, mezclar con POIs personalizados
        return this.getRelevantCustomPoisObservable(query, latitude, longitude, pageSize).pipe(
          map((customPois: CustomPOI[]) => {
            console.log(`SearchService: ${customPois.length} POIs personalizados encontrados`);

            // Convertir POIs personalizados al formato estándar
            const standardizedCustomPois = customPois.map(customPoi => this.convertCustomPoiToPOI(customPoi));

            // Combinar y ordenar todos los POIs
            const allPois = [...standardizedCustomPois, ...foursquareResponse.pois];
            const sortedPois = this.sortMixedPois(allPois, latitude, longitude);
            
            // Paginar el resultado combinado
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedPois = sortedPois.slice(startIndex, endIndex);

            console.log(`SearchService: Devolviendo ${paginatedPois.length} POIs combinados (${standardizedCustomPois.length} personalizados + ${foursquareResponse.pois.length} Foursquare)`);

            const result: PaginatedResponse = {
              pois: paginatedPois,
              total: Math.max(sortedPois.length, foursquareResponse.total),
              hasMore: endIndex < sortedPois.length || foursquareResponse.hasMore,
              page: page,
              pageSize: pageSize
            };

            return result;
          })
        );
      })
    );
  }

  // Método simplificado para búsquedas básicas (sin POIs personalizados)
  getBasicSearchResults(
    query: string,
    latitude: number,
    longitude: number,
    page: number = 1,
    pageSize: number = 12
  ): Observable<PaginatedResponse> {
    console.log(`SearchService: Búsqueda básica - Query: "${query}", Página: ${page}`);

    if (query.trim()) {
      return this.foursquareService.globalSearchPaginated(query, latitude, longitude, page, pageSize);
    } else {
      return this.foursquareService.searchNearbyPaginated(latitude, longitude, page, pageSize);
    }
  }

  get lastQuery(): string {
    return this.lastSearchQuery;
  }

  get lastLocation(): SearchLocation {
    return this.lastSearchLocation;
  }

  updateSearchLocation(location: SearchLocation): void {
    this.lastSearchLocation = location;
    console.log('SearchService: Ubicación actualizada:', location);
  }

  clearSearch(): void {
    this.lastSearchQuery = '';
    console.log('SearchService: Búsqueda limpiada');
  }

  setProfileSearchQuery(query: string): void {
    this.profileSearchSubject.next(query);
    console.log('SearchService: Profile search query set:', query);
  }

  // Método para limpiar búsqueda de perfil
  clearProfileSearch(): void {
    this.profileSearchSubject.next('');
    console.log('SearchService: Profile search cleared');
  }

  hasActiveSearch(): boolean {
    return this.lastSearchQuery.length > 0;
  }

  // MÉTODO PRINCIPAL PARA BÚSQUEDA EN PERFIL - CORREGIDO
  searchUserPois(
    query: string,
    userCustomPois: CustomPOI[] = [],
    userFavorites: FavoritePoi[] = [] // Cambiar SavedPoi por FavoritePoi
  ): { customPois: CustomPOI[], favoritePois: FavoritePoi[] } { // Cambiar SavedPoi por FavoritePoi
    const normalizedQuery = query.toLowerCase().trim();
    
    console.log(`SearchService: Filtrando POIs del usuario con query: "${query}"`);
    console.log(`SearchService: Input - ${userCustomPois.length} custom POIs, ${userFavorites.length} favoritos`);
    
    if (!normalizedQuery) {
      // Sin query, devolver todos
      return {
        customPois: userCustomPois,
        favoritePois: userFavorites
      };
    }
    
    const filteredCustom = userCustomPois.filter(poi =>
      poi.name.toLowerCase().includes(normalizedQuery) ||
      poi.description.toLowerCase().includes(normalizedQuery) ||
      poi.category.toLowerCase().includes(normalizedQuery)
    );
    
    const filteredFavorites = userFavorites.filter(poi =>
      poi.name.toLowerCase().includes(normalizedQuery) ||
      poi.description.toLowerCase().includes(normalizedQuery) ||
      poi.category.toLowerCase().includes(normalizedQuery)
    );
    
    console.log(`SearchService: Resultado filtro - ${filteredCustom.length} custom POIs, ${filteredFavorites.length} favoritos`);
    
    return {
      customPois: filteredCustom,
      favoritePois: filteredFavorites
    };
  }

  // MÉTODO PARA BÚSQUEDA EN CONTEXTO DE RUTAS (futuro) - CORREGIDO
  searchUserPoisForRoutes(
    query: string,
    userCustomPois: CustomPOI[] = [],
    userFavorites: FavoritePoi[] = [] // Cambiar SavedPoi por FavoritePoi
  ): { customPois: CustomPOI[], favoritePois: FavoritePoi[] } { // Cambiar SavedPoi por FavoritePoi
    // Reutilizar la misma lógica que searchUserPois
    // Pero podríamos añadir filtros adicionales específicos para rutas
    const result = this.searchUserPois(query, userCustomPois, userFavorites);
    
    // Filtros adicionales para rutas (ejemplo: solo POIs con buena accesibilidad)
    // result.customPois = result.customPois.filter(poi => poi.accessibility);
    
    return result;
  }

  // MÉTODOS PRIVADOS CORREGIDOS

  private getRelevantCustomPoisObservable(query: string, latitude: number, longitude: number, limit: number): Observable<CustomPOI[]> {
    try {
      if (!query.trim()) {
        // Sin query, devolver los más cercanos - USAR NUEVO MÉTODO
        return this.customPoiService.getCustomPois().pipe(
          map(allCustomPois => 
            this.sortCustomPoisByDistance(allCustomPois, latitude, longitude).slice(0, Math.floor(limit / 2))
          )
        );
      }

      // Con query, buscar por texto - USAR NUEVO MÉTODO
      return this.customPoiService.searchCustomPois(query, latitude, longitude).pipe(
        map(searchResults => searchResults.slice(0, Math.floor(limit / 2)))
      );
    } catch (error) {
      console.error('SearchService: Error obteniendo POIs personalizados:', error);
      return of([]);
    }
  }

  private getAllCustomPoisObservable(): Observable<CustomPOI[]> {
    try {
      // TODO: Integrar con servicio de autenticación real
      const currentUserId = 'user123'; // ID de usuario temporal
      return this.customPoiService.getUserCustomPois(currentUserId);
    } catch (error) {
      console.error('SearchService: Error obteniendo POIs del usuario:', error);
      return of([]);
    }
  }

  private getAllCustomPois(): CustomPOI[] {
    try {
      // TODO: Integrar con servicio de autenticación real
      const currentUserId = 'user123'; // ID de usuario temporal
      // This is a synchronous version - you should use the Observable version in async contexts
      const customPois = this.customPoiService.getUserCustomPois(currentUserId);
      // Note: This assumes the service has a synchronous method or you handle this differently
      return [];
    } catch (error) {
      console.error('SearchService: Error obteniendo POIs del usuario:', error);
      return [];
    }
  }

  private sortCustomPoisByDistance(customPois: CustomPOI[], userLat: number, userLng: number): CustomPOI[] {
    return [...customPois].sort((a, b) => {
      const distanceA = this.calculateDistance(userLat, userLng, a.latitude, a.longitude);
      const distanceB = this.calculateDistance(userLat, userLng, b.latitude, b.longitude);
      return distanceA - distanceB;
    });
  }

  private convertCustomPoiToPOI(customPoi: CustomPOI): POI & { isCustom: true } {
    return {
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
      isFavorite: customPoi.isFavorite,
      isCustom: true // Marcador especial para identificar POIs personalizados
    };
  }

  private sortMixedPois(pois: (POI | (POI & { isCustom: true }))[], userLat: number, userLng: number): (POI | (POI & { isCustom: true }))[] {
    return pois.sort((a, b) => {
      try {
        // Priorizar POIs personalizados si están muy cerca (menos de 1km)
        const distanceA = this.calculateDistance(userLat, userLng, a.latitude, a.longitude);
        const distanceB = this.calculateDistance(userLat, userLng, b.latitude, b.longitude);

        // Verificar si son POIs personalizados y están cerca
        const isCustomA = 'isCustom' in a && a.isCustom;
        const isCustomB = 'isCustom' in b && b.isCustom;

        if (isCustomA && distanceA < 1 && (!isCustomB || distanceB >= 1)) {
          return -1; // POI personalizado cercano tiene prioridad
        }
        if (isCustomB && distanceB < 1 && (!isCustomA || distanceA >= 1)) {
          return 1;
        }

        // Si ambos son personalizados y cercanos, o ninguno es personalizado cercano, ordenar por distancia
        return distanceA - distanceB;
      } catch (error) {
        console.error('SearchService: Error ordenando POIs:', error);
        return 0; // Mantener orden original si hay error
      }
    });
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    try {
      const R = 6371; // Radio de la Tierra en km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    } catch (error) {
      console.error('SearchService: Error calculando distancia:', error);
      return 0;
    }
  }

  // MÉTODOS ADICIONALES PARA GESTIÓN DE POIs PERSONALIZADOS

  // Actualizar distancias de POIs personalizados cuando cambie la ubicación del usuario
  updateCustomPoisDistances(userLatitude: number, userLongitude: number): void {
    try {
      // Get all custom POIs first, then update distances
      this.getAllCustomPoisObservable().subscribe(customPois => {
        this.customPoiService.updateDistancesFromLocation(userLatitude, userLongitude, customPois);
        console.log('SearchService: Distancias de POIs personalizados actualizadas');
      });
    } catch (error) {
      console.error('SearchService: Error actualizando distancias de POIs personalizados:', error);
    }
  }

  // Verificar si un POI es personalizado por su ID
  isCustomPoi(poiId: string): boolean {
    return poiId.startsWith('custom_');
  }

  getCustomPoiById(poiId: string): Observable<CustomPOI | null> {
    try {
      return this.customPoiService.getCustomPoiById(poiId);
    } catch (error) {
      console.error('SearchService: Error getting custom POI by ID:', error);
      return of(null);
    }
  }

  // Obtener estadísticas de POIs personalizados
  getCustomPoisStats(): Observable<{ total: number; byCategory: { [key: string]: number } }> {
    try {
      return this.getAllCustomPoisObservable().pipe(
        map(allCustomPois => {
          const byCategory: { [key: string]: number } = {};

          allCustomPois.forEach(poi => {
            byCategory[poi.category] = (byCategory[poi.category] || 0) + 1;
          });

          return {
            total: allCustomPois.length,
            byCategory
          };
        })
      );
    } catch (error) {
      console.error('SearchService: Error obteniendo estadísticas de POIs personalizados:', error);
      return of({ total: 0, byCategory: {} });
    }
  }

  private getCustomPoisByUser(currentUserId: string, limit: number): Observable<CustomPOI[]> {
    try {
      return this.customPoiService.getUserCustomPois(currentUserId).pipe(
        map(searchResults => (searchResults || []).slice(0, Math.floor(limit / 2)))
      );
    } catch (error) {
      console.error('SearchService: Error getting custom POIs by user:', error);
      return of([]);
    }
  }

  private getCustomPoisNearby(userLatitude: number, userLongitude: number, limit: number): Observable<CustomPOI[]> {
    try {
      return this.customPoiService.getUserCustomPois().pipe(
        map(allCustomPois => {
          if (!allCustomPois || allCustomPois.length === 0) {
            return [];
          }
          
          // Update distances and return nearby POIs
          const poisWithDistances = this.customPoiService.updateDistancesFromLocation(
            userLatitude, 
            userLongitude, 
            allCustomPois
          );
          
          return poisWithDistances.slice(0, Math.floor(limit / 2));
        })
      );
    } catch (error) {
      console.error('SearchService: Error getting nearby custom POIs:', error);
      return of([]);
    }
  }
}