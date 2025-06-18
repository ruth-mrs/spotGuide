import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface RouteGenerationRequest {
  pois: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    image?: string;
  }>;
  preferences: string;
  duration: string;
  baseLocation: string;
}

export interface RoutePOI {
  poiId: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  image?: string;
  timeToSpend: string;
  notes?: string;
  isCustom?: boolean;
}

export interface GeneratedRoute {
  _id?: string;
  name: string;
  description: string;
  orderedPois: RoutePOI[];
  totalDistance: string;
  estimatedTime: string;
  difficulty: 'Fácil' | 'Moderada' | 'Difícil';
  bestTimeToVisit: string;
  transportRecommendations: string;
  recommendations: string[];
  createdAt?: Date;
  userId?: string;
}

export interface RouteGenerationResponse {
  success: boolean;
  message: string;
  route: GeneratedRoute;
}

@Injectable({
  providedIn: 'root'
})
export class RouteGeneratorService {
  private readonly BACKEND_URL = environment.apiUrl; 
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  private isGeneratingSubject = new BehaviorSubject<boolean>(false);
  public isGenerating$ = this.isGeneratingSubject.asObservable();

  private savedRoutesSubject = new BehaviorSubject<GeneratedRoute[]>([]);
  public savedRoutes$ = this.savedRoutesSubject.asObservable();

  constructor() {
    console.log('RouteGeneratorService: Inicializando servicio de rutas');
  }

  // Generar ruta con IA
  generateRoute(request: RouteGenerationRequest): Observable<RouteGenerationResponse> {
    console.log('🤖 Enviando solicitud de generación de ruta:', request);
    
    this.isGeneratingSubject.next(true);

    const currentUser = this.authService.getCurrentUser();
    const requestWithUser = {
      ...request,
      userId: currentUser?.id
    };

    return new Observable<RouteGenerationResponse>(observer => {
      this.http.post<RouteGenerationResponse>(`${this.BACKEND_URL}/generate-route`, requestWithUser)
        .subscribe({
          next: (response) => {
            console.log('✅ Ruta generada exitosamente:', response);
            this.isGeneratingSubject.next(false);
            
            if (response.success) {
              // Actualizar rutas guardadas
              this.loadUserRoutes();
            }
            
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            console.error('❌ Error generando ruta:', error);
            this.isGeneratingSubject.next(false);
            observer.error(error);
          }
        });
    });
  }

  // Cargar rutas del usuario
  loadUserRoutes(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.savedRoutesSubject.next([]);
      return;
    }

    this.http.get<{ success: boolean; routes: GeneratedRoute[] }>(`${this.BACKEND_URL}/user-routes/${currentUser.id}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.savedRoutesSubject.next(response.routes);
            console.log(`📋 ${response.routes.length} rutas cargadas`);
          }
        },
        error: (error) => {
          console.error('Error cargando rutas:', error);
          this.savedRoutesSubject.next([]);
        }
      });
  }

  // Eliminar ruta
  deleteRoute(routeId: string): Observable<{ success: boolean; message: string }> {
    return new Observable(observer => {
      this.http.delete<{ success: boolean; message: string }>(`${this.BACKEND_URL}/route/${routeId}`)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.loadUserRoutes(); 
            }
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            observer.error(error);
          }
        });
    });
  }

  // Generar URL de Google Maps
  generateGoogleMapsUrl(route: GeneratedRoute): string | null {
    if (route.orderedPois.length === 0) return null;

    const origin = `${route.orderedPois[0].latitude},${route.orderedPois[0].longitude}`;
    const destination = `${route.orderedPois[route.orderedPois.length - 1].latitude},${route.orderedPois[route.orderedPois.length - 1].longitude}`;
    
    let waypoints = '';
    if (route.orderedPois.length > 2) {
      const waypointCoords = route.orderedPois
        .slice(1, -1)
        .map(poi => `${poi.latitude},${poi.longitude}`)
        .join('|');
      waypoints = `&waypoints=${waypointCoords}`;
    }

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}&travelmode=driving`;
  }
}