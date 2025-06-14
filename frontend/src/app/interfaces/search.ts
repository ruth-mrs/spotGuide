import { POI } from '../components/poi-card/poi-card.component';

export interface PaginatedResponse {
  pois: POI[];
  total: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

export interface SearchResponse {
  pois: POI[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface SearchLocation {
  lat: number;
  lng: number;
}

export interface SearchFilters {
  category?: string;
  radius?: number;
  minRating?: number;
}