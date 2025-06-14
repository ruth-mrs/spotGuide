import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { FoursquareService } from './foursquare.service';
import { POI } from '../components/poi-card/poi-card.component';

interface SearchResponse {
  pois: POI[];
  total: number;
  page: number;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private router = inject(Router);
  private foursquareService = inject(FoursquareService);

  private lastSearchQuery: string = '';
  private lastSearchLocation: { lat: number; lng: number } = { lat: 36.8377, lng: -2.4585 };

  performGlobalSearch(query: string, location?: { lat: number; lng: number }): void {
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
  ): Observable<SearchResponse> {
    console.log(`SearchService: Obteniendo resultados página ${page} para "${query}"`);

    if (!query || query.trim().length === 0) {
      return this.foursquareService.searchNearbyPaginated(latitude, longitude, page, pageSize);
    } else {
      return this.foursquareService.globalSearchPaginated(query, latitude, longitude, page, pageSize);
    }
  }

  get lastQuery(): string {
    return this.lastSearchQuery;
  }

  get lastLocation(): { lat: number; lng: number } {
    return this.lastSearchLocation;
  }

  updateSearchLocation(location: { lat: number; lng: number }): void {
    this.lastSearchLocation = location;
    console.log('SearchService: Ubicación actualizada:', location);
  }

  clearSearch(): void {
    this.lastSearchQuery = '';
    console.log('SearchService: Búsqueda limpiada');
  }

  hasActiveSearch(): boolean {
    return this.lastSearchQuery.length > 0;
  }
}