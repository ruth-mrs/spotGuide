import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of, forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
import { POI } from '../components/poi-card/poi-card.component';


interface FoursquareVenue {
  fsq_id: string;
  name: string;
  location: {
    address?: string;
    locality?: string;
    region?: string;
    country?: string;
    formatted_address?: string;
    latitude?: number;  // Hacer opcional
    longitude?: number; // Hacer opcional
  };
  // AÑADIR geocodes que es donde Foursquare pone las coordenadas
  geocodes?: {
    main?: {
      latitude: number;
      longitude: number;
    };
    roof?: {
      latitude: number;
      longitude: number;
    };
  };
  categories: Array<{
    id: string;
    name: string;
    short_name: string;
    plural_name: string;
    icon: {
      prefix: string;
      suffix: string;
    };
  }>;
  distance?: number;
  rating?: number;
  stats?: {
    total_ratings?: number;
    total_photos?: number;
    total_tips?: number;
  };
  photos?: Array<{
    id: string;
    prefix: string;
    suffix: string;
    width: number;
    height: number;
  }>;
}
interface FoursquareResponse {
  results: FoursquareVenue[];
}

interface PaginatedResponse {
  pois: POI[];
  total: number;
  page: number;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FoursquareService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api.foursquare.com/v3';
  
  // Cache para almacenar todos los POIs encontrados por búsqueda
  private allPoisCache = new Map<string, POI[]>();
  
  private get headers(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': environment.fourSquareApiKey,
      'Accept': 'application/json'
    });
  }

  // Método de búsqueda cercana paginada CORREGIDO
  searchNearbyPaginated(
    latitude: number, 
    longitude: number, 
    page: number = 1, 
    pageSize: number = 12
  ): Observable<PaginatedResponse> {
    const cacheKey = `nearby_${latitude}_${longitude}`;
    
    console.log(`FoursquareService: Página ${page} solicitada, pageSize ${pageSize}`);
    
    // Si es la primera página o no tenemos cache, hacer búsqueda completa
    if (page === 1 || !this.allPoisCache.has(cacheKey)) {
      console.log(`FoursquareService: Cargando desde API para página ${page}`);
      return this.loadAllNearbyPois(latitude, longitude, cacheKey).pipe(
        map(allPois => this.paginateResults(allPois, page, pageSize, cacheKey))
      );
    } else {
      // Si ya tenemos el cache, paginar desde ahí
      console.log(`FoursquareService: Usando cache para página ${page}`);
      const allPois = this.allPoisCache.get(cacheKey) || [];
      return of(this.paginateResults(allPois, page, pageSize, cacheKey));
    }
  }

  // Método de búsqueda global paginada CORREGIDO
  globalSearchPaginated(
    query: string,
    latitude: number, 
    longitude: number,
    page: number = 1,
    pageSize: number = 12
  ): Observable<PaginatedResponse> {
    const cacheKey = `search_${query}_${latitude}_${longitude}`;
    
    console.log(`FoursquareService: Búsqueda "${query}" página ${page} solicitada`);
    
    // Si es la primera página o no tenemos cache, hacer búsqueda completa
    if (page === 1 || !this.allPoisCache.has(cacheKey)) {
      console.log(`FoursquareService: Cargando desde API para búsqueda "${query}" página ${page}`);
      return this.loadAllSearchResults(query, latitude, longitude, cacheKey).pipe(
        map(allPois => this.paginateResults(allPois, page, pageSize, cacheKey))
      );
    } else {
      // Si ya tenemos el cache, paginar desde ahí
      console.log(`FoursquareService: Usando cache para búsqueda "${query}" página ${page}`);
      const allPois = this.allPoisCache.get(cacheKey) || [];
      return of(this.paginateResults(allPois, page, pageSize, cacheKey));
    }
  }

  // Actualizar el método loadAllNearbyPois para más debug:

private loadAllNearbyPois(
  latitude: number, 
  longitude: number, 
  cacheKey: string
): Observable<POI[]> {
  console.log(`FoursquareService: Cargando todos los POIs cercanos para ${cacheKey}`);
  
  // Hacer múltiples búsquedas con diferentes radios para obtener más variedad
  const searches = [
    this.searchNearby(latitude, longitude, 2000, 20, 0),   // 2km, 20 items
    this.searchNearby(latitude, longitude, 5000, 30, 0),   // 5km, 30 items
    this.searchNearby(latitude, longitude, 10000, 40, 0),  // 10km, 40 items
  ];

  return forkJoin(searches).pipe(
    map(results => {
      console.log(`FoursquareService: Resultados de búsquedas:`, results.map(r => r.length));
      
      // Combinar todos los resultados
      const allPois: POI[] = [];
      results.forEach((poisArray, index) => {
        console.log(`FoursquareService: Búsqueda ${index + 1} devolvió ${poisArray.length} POIs válidos`);
        allPois.push(...poisArray);
      });
      
      console.log(`FoursquareService: Total POIs antes de eliminar duplicados: ${allPois.length}`);
      
      if (allPois.length === 0) {
        console.error('FoursquareService: ¡No se encontraron POIs válidos en ninguna búsqueda!');
        console.error('FoursquareService: Coordenadas de búsqueda:', latitude, longitude);
        return [];
      }
      
      // Eliminar duplicados
      const uniquePois = this.removeDuplicatePOIs(allPois);
      
      // Ordenar por distancia
      const sortedPois = uniquePois.sort((a, b) => {
        const distanceA = this.parseDistance(a.distance);
        const distanceB = this.parseDistance(b.distance);
        return distanceA - distanceB;
      });
      
      console.log(`FoursquareService: ${sortedPois.length} POIs únicos encontrados para búsqueda cercana`);
      console.log(`FoursquareService: Primeros 5 POIs:`, sortedPois.slice(0, 5).map(p => ({ 
        id: p.id, 
        name: p.name, 
        lat: p.latitude, 
        lng: p.longitude 
      })));
      
      // Guardar en cache
      this.allPoisCache.set(cacheKey, sortedPois);
      
      return sortedPois;
    }),
    catchError(error => {
      console.error('Error loading all nearby POIs:', error);
      return of([]);
    })
  );
}

  // También actualizar loadAllSearchResults para manejar búsquedas lejanas:
private loadAllSearchResults(
  query: string,
  latitude: number, 
  longitude: number,
  cacheKey: string
): Observable<POI[]> {
  console.log(`FoursquareService: Cargando todos los resultados para "${query}"`);
  
  // Si es una búsqueda de ubicación, usar búsqueda global
  if (this.isLocationQuery(query)) {
    console.log(`FoursquareService: Búsqueda de ubicación detectada para "${query}"`);
    const searches = [
      this.searchByLocationName(query, 50, 0),  // Primera tanda
      this.searchByLocationName(query, 50, 50), // Segunda tanda
    ];
    
    return forkJoin(searches).pipe(
      map(results => {
        const allPois: POI[] = [];
        results.forEach(poisArray => {
          allPois.push(...poisArray);
        });
        
        console.log(`FoursquareService: Total POIs para ubicación "${query}": ${allPois.length}`);
        
        const uniquePois = this.removeDuplicatePOIs(allPois);
        const sortedPois = uniquePois.sort((a, b) => {
          // Para búsquedas de ubicación, ordenar por rating primero
          if (a.rating !== b.rating) {
            return b.rating - a.rating;
          }
          return a.name.localeCompare(b.name);
        });
        
        console.log(`FoursquareService: ${sortedPois.length} POIs únicos para "${query}"`);
        this.allPoisCache.set(cacheKey, sortedPois);
        
        return sortedPois;
      }),
      catchError(error => {
        console.error('Error loading location search results:', error);
        return of([]);
      })
    );
  }
  
  // Para búsquedas normales, usar la lógica actual
  const searches = [
    this.globalSearch(query, latitude, longitude, 5000, 25, 0),
    this.globalSearch(query, latitude, longitude, 15000, 35, 0),
    this.globalSearch(query, latitude, longitude, 30000, 45, 0),
  ];

  return forkJoin(searches).pipe(
    map(results => {
      const allPois: POI[] = [];
      results.forEach(poisArray => {
        allPois.push(...poisArray);
      });
      
      const uniquePois = this.removeDuplicatePOIs(allPois);
      const sortedPois = uniquePois.sort((a, b) => {
        const distanceA = this.parseDistance(a.distance);
        const distanceB = this.parseDistance(b.distance);
        return distanceA - distanceB;
      });
      
      console.log(`FoursquareService: ${sortedPois.length} POIs únicos encontrados para búsqueda "${query}"`);
      this.allPoisCache.set(cacheKey, sortedPois);
      
      return sortedPois;
    }),
    catchError(error => {
      console.error('Error loading all search results:', error);
      return of([]);
    })
  );
}

  // Paginar resultados desde el cache - MEJORADO
  private paginateResults(
  allPois: POI[], 
  page: number, 
  pageSize: number, 
  cacheKey: string
): PaginatedResponse {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  const pagePois = allPois.slice(startIndex, endIndex);
  const hasMore = endIndex < allPois.length;
  
  console.log(`FoursquareService: Paginando ${cacheKey}`);
  console.log(`FoursquareService: Total POIs en cache: ${allPois.length}`);
  console.log(`FoursquareService: Página ${page} - índices ${startIndex}-${Math.min(endIndex, allPois.length)}`);
  console.log(`FoursquareService: POIs en esta página: ${pagePois.length}, hasMore: ${hasMore}`);
  console.log(`FoursquareService: POIs solicitados en página ${page}:`, pagePois.map(p => ({ 
    id: p.id, 
    name: p.name 
  })));
  
  // VERIFICACIÓN ADICIONAL: Si no hay POIs en esta página pero quedan en cache
  if (pagePois.length === 0 && hasMore) {
    console.warn(`FoursquareService: ADVERTENCIA - Página ${page} vacía pero hasMore es true`);
    console.warn(`FoursquareService: startIndex: ${startIndex}, endIndex: ${endIndex}, total: ${allPois.length}`);
  }
  
  return {
    pois: pagePois,
    total: allPois.length,
    page: page,
    hasMore: hasMore
  };
}

  // Método para limpiar cache
  clearSearchCache(searchType?: string, query?: string, latitude?: number, longitude?: number) {
    if (searchType && query !== undefined && latitude !== undefined && longitude !== undefined) {
      // Limpiar cache específico
      const cacheKey = searchType === 'nearby' 
        ? `nearby_${latitude}_${longitude}`
        : `search_${query}_${latitude}_${longitude}`;
      this.allPoisCache.delete(cacheKey);
      console.log(`FoursquareService: Cache limpiado para ${cacheKey}`);
    } else {
      // Limpiar todo el cache
      this.allPoisCache.clear();
      console.log('FoursquareService: Todo el cache limpiado');
    }
  }

  searchNearby(latitude: number, longitude: number, radius = 5000, limit = 20, offset = 0): Observable<POI[]> {
  const url = `${this.baseUrl}/places/search`;
  const params = {
    ll: `${latitude},${longitude}`,
    radius: radius.toString(),
    limit: limit.toString(),
    offset: offset.toString(),
    // CORREGIR: incluir geocodes para obtener las coordenadas
    fields: 'fsq_id,name,location,geocodes,categories,distance,rating,stats,photos',
    sort: 'DISTANCE'
  };

  console.log(`FoursquareService: Búsqueda básica cercana - radio ${radius}m, límite ${limit}, offset ${offset}`);

  return this.http.get<FoursquareResponse>(url, { 
    headers: this.headers, 
    params 
  }).pipe(
    map(response => {
      console.log(`FoursquareService: Respuesta raw de Foursquare:`, response.results.slice(0, 2)); // Ver primeros 2 para debug
      
      const validPois = response.results
        .map(venue => this.transformVenueToPOI(venue))
        .filter((poi): poi is POI => poi !== null);
      
      console.log(`FoursquareService: Búsqueda básica devolvió ${validPois.length} POIs válidos de ${response.results.length} totales`);
      return validPois;
    }),
    catchError(error => {
      console.error('Error fetching nearby places:', error);
      return of([]);
    })
  );
}


 searchByText(
  query: string,
  latitude: number, 
  longitude: number, 
  radius = 10000, 
  limit = 30,
  offset = 0
): Observable<POI[]> {
  const url = `${this.baseUrl}/places/search`;
  const params = {
    query: query,
    ll: `${latitude},${longitude}`,
    radius: radius.toString(),
    limit: limit.toString(),
    offset: offset.toString(),
    // CORREGIR: incluir geocodes para obtener las coordenadas
    fields: 'fsq_id,name,location,geocodes,categories,distance,rating,stats,photos',
    sort: 'RELEVANCE'
  };

  console.log(`FoursquareService: Búsqueda por texto "${query}" - radio ${radius}m, límite ${limit}, offset ${offset}`);

  return this.http.get<FoursquareResponse>(url, { 
    headers: this.headers, 
    params 
  }).pipe(
    map(response => {
      console.log(`FoursquareService: Respuesta raw búsqueda texto:`, response.results.slice(0, 2)); // Ver primeros 2 para debug
      
      const validPois = response.results
        .map(venue => this.transformVenueToPOI(venue))
        .filter((poi): poi is POI => poi !== null);
      
      console.log(`FoursquareService: Búsqueda por texto devolvió ${validPois.length} POIs válidos de ${response.results.length} totales`);
      return validPois;
    }),
    catchError(error => {
      console.error('Error searching places by text:', error);
      return of([]);
    })
  );
}

  // Detectar si es una búsqueda de ubicación (ciudad, país, etc.)
private isLocationQuery(query: string): boolean {
  const locationKeywords = [
    'madrid', 'barcelona', 'sevilla', 'valencia', 'bilbao', 'zaragoza', 'málaga', 'murcia',
    'palma', 'córdoba', 'valladolid', 'vigo', 'gijón', 'hospitalet', 'coruña', 'granada',
    'vitoria', 'elche', 'oviedo', 'badalona', 'cartagena', 'terrassa', 'jerez', 'sabadell',
    'pamplona', 'santander', 'toledo', 'burgos', 'logroño', 'badajoz', 'salamanca',
    'huelva', 'lleida', 'tarragona', 'león', 'castellón', 'almería', 'ávila', 'cáceres',
    'cuenca', 'girona', 'guadalajara', 'huesca', 'jaén', 'orense', 'palencia', 'pontevedra',
    'segovia', 'soria', 'teruel', 'zamora',
    // Países
    'españa', 'france', 'portugal', 'italy', 'germany', 'uk', 'london', 'paris', 'rome',
    'new york', 'tokyo', 'berlin', 'amsterdam'
  ];
  
  const normalizedQuery = query.toLowerCase().trim();
  return locationKeywords.some(keyword => 
    normalizedQuery.includes(keyword) || keyword.includes(normalizedQuery)
  );
}

private searchByLocationName(locationName: string, limit: number = 30, offset: number = 0): Observable<POI[]> {
  const url = `${this.baseUrl}/places/search`;
  const params = {
    query: locationName,
    limit: Math.min(limit, 50).toString(),
    offset: offset.toString(),
    // CORREGIR: incluir geocodes para obtener las coordenadas
    fields: 'fsq_id,name,location,geocodes,categories,distance,rating,stats,photos',
    sort: 'RELEVANCE'
  };

  console.log(`FoursquareService: Búsqueda global por ubicación "${locationName}"`);

  return this.http.get<FoursquareResponse>(url, { 
    headers: this.headers, 
    params 
  }).pipe(
    map(response => {
      console.log(`FoursquareService: Respuesta raw búsqueda ubicación:`, response.results.slice(0, 2)); // Ver primeros 2 para debug
      
      const validPois = response.results
        .map(venue => this.transformVenueToPOI(venue))
        .filter((poi): poi is POI => poi !== null);
      
      console.log(`FoursquareService: Búsqueda global devolvió ${validPois.length} POIs válidos de ${response.results.length} totales para "${locationName}"`);
      return validPois;
    }),
    catchError(error => {
      console.error(`Error searching globally for "${locationName}":`, error);
      return of([]);
    })
  );
}


  globalSearch(
  query: string,
  latitude: number, 
  longitude: number,
  radius = 10000,
  limit = 30,
  offset = 0
): Observable<POI[]> {
  console.log(`FoursquareService: Global search "${query}" desde ${latitude}, ${longitude}`);
  
  // Para búsquedas de texto (como nombres de ciudades), hacer búsqueda sin restricción de ubicación
  if (this.isLocationQuery(query)) {
    console.log(`FoursquareService: "${query}" parece ser una búsqueda de ubicación, usando búsqueda global`);
    return this.searchByLocationName(query, limit, offset);
  }
  
  // Para búsquedas normales, usar la lógica actual
  const foursquareSearch = this.searchByText(query, latitude, longitude, radius, Math.floor(limit * 0.8), offset);
  const localSearch = this.searchLocalPOIs(query, latitude, longitude, radius, Math.ceil(limit * 0.2), offset);

  return forkJoin([foursquareSearch, localSearch]).pipe(
    map(([foursquarePOIs, localPOIs]) => {
      const allPOIs = [...foursquarePOIs, ...localPOIs];
      const uniquePOIs = this.removeDuplicatePOIs(allPOIs);
      
      const sortedPOIs = uniquePOIs.sort((a, b) => {
        const distanceA = this.parseDistance(a.distance);
        const distanceB = this.parseDistance(b.distance);
        return distanceA - distanceB;
      });
      
      return sortedPOIs.slice(0, limit);
    }),
    catchError(error => {
      console.error('Error in global search:', error);
      return of([]);
    })
  );
}

  // Método mejorado para eliminar duplicados
  private removeDuplicatePOIs(pois: POI[]): POI[] {
    const seen = new Map<string, POI>();
    const tolerance = 0.001; // ~100 metros de tolerancia

    return pois.filter(poi => {
      // Crear una clave basada en ID único de Foursquare
      if (poi.id && poi.id.startsWith('fsq_')) {
        if (seen.has(poi.id)) {
          return false;
        }
        seen.set(poi.id, poi);
        return true;
      }

      // Para POIs sin ID de Foursquare, usar nombre y ubicación
      const normalizedName = poi.name.toLowerCase().trim();
      const roundedLat = Math.round(poi.latitude / tolerance) * tolerance;
      const roundedLng = Math.round(poi.longitude / tolerance) * tolerance;
      const locationKey = `${normalizedName}_${roundedLat}_${roundedLng}`;
      
      if (seen.has(locationKey)) {
        const existingPoi = seen.get(locationKey)!;
        // Si encontramos un duplicado, mantener el que tenga mejor rating
        if (poi.rating > existingPoi.rating) {
          seen.set(locationKey, poi);
          return true;
        }
        return false;
      }
      
      seen.set(locationKey, poi);
      return true;
    });
  }

  // Búsqueda local
  private searchLocalPOIs(
    query: string,
    latitude: number, 
    longitude: number,
    radius: number,
    limit: number = 10,
    offset: number = 0
  ): Observable<POI[]> {
    // TODO: Implementar búsqueda real en base de datos local
    const mockLocalPOIs: POI[] = [];
    return of(mockLocalPOIs.slice(offset, offset + limit));
  }

  private parseDistance(distance: string): number {
    if (distance === 'N/A') return Infinity;
    
    const numStr = distance.replace(/[^\d.]/g, '');
    const num = parseFloat(numStr);
    
    if (distance.includes('km')) {
      return num * 1000;
    }
    return num;
  }

  // Reemplazar el método transformVenueToPOI:

private transformVenueToPOI(venue: FoursquareVenue): POI | null {
  console.log(`FoursquareService: Transformando venue "${venue.name}":`, {
    location: venue.location,
    geocodes: venue.geocodes
  });

  // Obtener coordenadas de geocodes (preferido) o location (fallback)
  let latitude: number | undefined;
  let longitude: number | undefined;

  // Priorizar geocodes.main
  if (venue.geocodes?.main?.latitude && venue.geocodes?.main?.longitude) {
    latitude = venue.geocodes.main.latitude;
    longitude = venue.geocodes.main.longitude;
    console.log(`FoursquareService: Usando geocodes.main para "${venue.name}":`, latitude, longitude);
  }
  // Fallback a geocodes.roof
  else if (venue.geocodes?.roof?.latitude && venue.geocodes?.roof?.longitude) {
    latitude = venue.geocodes.roof.latitude;
    longitude = venue.geocodes.roof.longitude;
    console.log(`FoursquareService: Usando geocodes.roof para "${venue.name}":`, latitude, longitude);
  }
  // Fallback a location (por si acaso)
  else if (venue.location?.latitude && venue.location?.longitude) {
    latitude = venue.location.latitude;
    longitude = venue.location.longitude;
    console.log(`FoursquareService: Usando location para "${venue.name}":`, latitude, longitude);
  }

  // Validar que tengamos coordenadas válidas
  if (!latitude || !longitude || 
      typeof latitude !== 'number' || 
      typeof longitude !== 'number' ||
      isNaN(latitude) || 
      isNaN(longitude) ||
      latitude === 0 || 
      longitude === 0) {
    console.warn(`FoursquareService: Venue "${venue.name}" no tiene coordenadas válidas:`, {
      latitude,
      longitude,
      location: venue.location,
      geocodes: venue.geocodes
    });
    return null;
  }

  const poi = {
    id: venue.fsq_id,
    name: venue.name,
    description: this.generateDescription(venue),
    image: this.getVenueImage(venue),
    rating: this.convertRating(venue.rating),
    reviewCount: venue.stats?.total_ratings || 0,
    category: this.mapCategory(venue.categories[0]?.name || 'General'),
    distance: this.formatDistance(venue.distance),
    estimatedTime: this.calculateEstimatedTime(venue.distance),
    latitude: latitude,
    longitude: longitude,
    isFavorite: false
  };

  console.log(`FoursquareService: POI creado exitosamente: "${poi.name}" en ${poi.latitude}, ${poi.longitude}`);
  return poi;
}

  private generateDescription(venue: FoursquareVenue): string {
    const category = venue.categories[0]?.name || 'Lugar de interés';
    const location = venue.location.locality || venue.location.region || venue.location.formatted_address || '';
    return `${category} ${location ? `ubicado en ${location}` : ''}. Descubre este punto de interés y disfruta de la experiencia.`.trim();
  }

  private getVenueImage(venue: FoursquareVenue): string {
    if (venue.photos && venue.photos.length > 0) {
      const photo = venue.photos[0];
      return `${photo.prefix}400x300${photo.suffix}`;
    }
    
    const category = venue.categories[0]?.name.toLowerCase() || '';
    if (category.includes('restaurant') || category.includes('food') || category.includes('cafe')) {
      return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
    } else if (category.includes('park') || category.includes('nature') || category.includes('outdoor')) {
      return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop';
    } else if (category.includes('museum') || category.includes('art') || category.includes('historic')) {
      return 'https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=400&h=300&fit=crop';
    } else if (category.includes('hotel') || category.includes('accommodation')) {
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';
    } else if (category.includes('shop') || category.includes('store')) {
      return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop';
    }
    
    return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';
  }

  private convertRating(foursquareRating?: number): number {
    if (!foursquareRating) return 0;
    return Math.round((foursquareRating / 10) * 5 * 10) / 10;
  }

  private mapCategory(categoryName: string): string {
    const category = categoryName.toLowerCase();
    if (category.includes('restaurant') || category.includes('food') || category.includes('cafe') || category.includes('dining')) {
      return 'Restaurant';
    } else if (category.includes('park') || category.includes('nature') || category.includes('outdoor') || category.includes('recreation')) {
      return 'Nature';
    } else if (category.includes('museum') || category.includes('art') || category.includes('historic') || category.includes('monument')) {
      return 'Historical';
    } else if (category.includes('entertainment') || category.includes('theater') || category.includes('music') || category.includes('culture')) {
      return 'Culture';
    } else if (category.includes('shop') || category.includes('store') || category.includes('mall')) {
      return 'Shopping';
    } else if (category.includes('hotel') || category.includes('accommodation')) {
      return 'Accommodation';
    }
    return 'General';
  }

  private formatDistance(distance?: number): string {
    if (!distance) return 'N/A';
    
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  }

  private calculateEstimatedTime(distance?: number): string {
    if (!distance) return 'N/A';
    
    const walkingTimeMinutes = Math.round((distance / 1000) / 5 * 60);
    
    if (walkingTimeMinutes < 60) {
      return `${walkingTimeMinutes} min`;
    } else {
      const hours = Math.floor(walkingTimeMinutes / 60);
      const minutes = walkingTimeMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }
}