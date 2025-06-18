import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { TokenService } from './token.service';
import { FavoritePoi } from './favorites.service';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  description?: string;
  avatar?: string;
  joinDate: Date;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  name: string;
  email: string;
  password: string;
  description?: string;
  avatar?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  token?: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  get<T>(arg0: string) {
    throw new Error('Method not implemented.');
  }
  private readonly apiUrl = 'http://localhost:3000/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {
    this.loadUserFromToken();
  }

  private loadUserFromToken() {
    const token = this.tokenService.getToken();
    if (token && this.tokenService.hasValidToken()) {
      this.verifyToken().subscribe({
        next: (response) => {
          if (response.valid && response.user) {
            this.currentUserSubject.next(response.user);
          }
        },
        error: () => {
          this.tokenService.clearAll();
        }
      });
    }
  }

  private getHttpOptions() {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
    return { headers };
  }

  // Autenticación
  login(credentials: LoginRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.token && response.user) {
            this.tokenService.setToken(response.token);
            this.tokenService.setUserData(response.user);
            this.currentUserSubject.next(response.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        tap(response => {
          if (response.success && response.token && response.user) {
            this.tokenService.setToken(response.token);
            this.tokenService.setUserData(response.user);
            this.currentUserSubject.next(response.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  verifyToken(): Observable<{ valid: boolean; user?: User }> {
    return this.http.get<{ valid: boolean; user?: User }>(`${this.apiUrl}/auth/verify`, this.getHttpOptions())
      .pipe(
        catchError(() => {
          return throwError(() => ({ valid: false }));
        })
      );
  }

  logout(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/auth/logout`, {}, this.getHttpOptions())
      .pipe(
        tap(() => {
          this.tokenService.clearAll();
          this.currentUserSubject.next(null);
        }),
        catchError(this.handleError)
      );
  }

  // Perfil de usuario
  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/auth/profile`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  updateProfile(userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/auth/profile`, userData, this.getHttpOptions())
      .pipe(
        tap(response => {
          if (response.success && response.user) {
            this.tokenService.setUserData(response.user);
            this.currentUserSubject.next(response.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  // Comentarios
  getCommentsByPoi(poiId: string): Observable<any[]> {
    return this.http.get<{ success: boolean; comments: any[] }>(`${this.apiUrl}/comments/poi/${poiId}`, this.getHttpOptions())
      .pipe(
        map(response => response.comments || []),
        catchError(this.handleError)
      );
  }

  addComment(commentData: {
    poiId: string;
    poiName: string;
    poiType: 'foursquare' | 'custom';
    rating: number;
    text: string;
  }): Observable<ApiResponse & { comment?: any }> {
    return this.http.post<ApiResponse & { comment?: any }>(`${this.apiUrl}/comments`, commentData, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getUserComments(): Observable<any[]> {
    return this.http.get<{ success: boolean; comments: any[] }>(`${this.apiUrl}/comments/my-comments`, this.getHttpOptions())
      .pipe(
        map(response => response.comments || []),
        catchError(this.handleError)
      );
  }

  getUserFavorites(): Observable<FavoritePoi[]> {
  console.log('HttpService: getUserFavorites - URL:', `${this.apiUrl}/favorites`);
  console.log('HttpService: getUserFavorites - Headers:', this.getHttpOptions());
  
  return this.http.get<{ success: boolean; favorites: FavoritePoi[] }>(`${this.apiUrl}/favorites`, this.getHttpOptions())
    .pipe(
      map(response => {
        console.log('HttpService: getUserFavorites - Respuesta completa:', response);
        return response.favorites || [];
      }),
      tap(favorites => {
        console.log(`HttpService: getUserFavorites - ${favorites.length} favoritos obtenidos:`, favorites);
      }),
      catchError(error => {
        console.error('HttpService: getUserFavorites - Error:', error);
        return of([]);
      })
    );
}

  toggleFavorite(favoriteData: {
  poiId: string;
  poiData: {
    name: string;
    description: string;
    image: string;
    category: string;
    latitude: number;
    longitude: number;
    rating: number;
    poiType: 'foursquare' | 'custom';
  };
}): Observable<{ success: boolean; isFavorite: boolean; message: string }> {
  console.log('HttpService: toggleFavorite - Datos enviados:', favoriteData);
  console.log('HttpService: toggleFavorite - URL:', `${this.apiUrl}/favorites/toggle`);
  console.log('HttpService: toggleFavorite - Headers:', this.getHttpOptions());
  console.log('HttpService: toggleFavorite - Token presente:', !!this.tokenService.getToken());
  
  return this.http.post<{ success: boolean; isFavorite: boolean; message: string }>(
    `${this.apiUrl}/favorites/toggle`, 
    favoriteData, 
    this.getHttpOptions()
  ).pipe(
    tap(response => {
      console.log('HttpService: toggleFavorite - Respuesta completa:', response);
      console.log('httpService: toggleFavorite - Success:', response.success);
      console.log('HttpService: toggleFavorite - IsFavorite:', response.isFavorite);
    }),
    catchError(error => {
      console.error('HttpService: toggleFavorite - Error completo:', error);
      console.error('HttpService: toggleFavorite - Error status:', error.status);
      console.error('HttpService: toggleFavorite - Error message:', error.message);
      console.error('HttpService: toggleFavorite - Error body:', error.error);
      
      return of({
        success: false,
        isFavorite: false,
        message: `Error de conexión: ${error.status} - ${error.message}`
      });
    })
  );
}

  checkFavorite(poiId: string): Observable<{ isFavorite: boolean }> {
  console.log('HttpService: checkFavorite - POI ID:', poiId);
  console.log('HttpService: checkFavorite - URL:', `${this.apiUrl}/favorites/check/${poiId}`);
  
  return this.http.get<{ isFavorite: boolean }>(`${this.apiUrl}/favorites/check/${poiId}`, this.getHttpOptions())
    .pipe(
      tap(response => {
        console.log(`HttpService: checkFavorite - POI ${poiId} es favorito:`, response.isFavorite);
      }),
      catchError(error => {
        console.error(`HttpService: checkFavorite - Error verificando POI ${poiId}:`, error);
        return of({ isFavorite: false });
      })
    );
}

  
getPublicCustomPois(params?: { 
  page?: number; 
  limit?: number; 
  lat?: number; 
  lng?: number; 
  radius?: number;
  search?: string;
}): Observable<any[]> {
  
  console.log('=== HttpService.getPublicCustomPois DEBUG ===');
  console.log('Parámetros recibidos:', params);
  console.log('API URL base:', this.apiUrl);
  
  let httpParams = new HttpParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
        console.log(`Parámetro agregado: ${key} = ${value}`);
      }
    });
  }

  const fullUrl = `${this.apiUrl}/custom-pois/public`;
  console.log('URL completa:', fullUrl);
  console.log('Parámetros HTTP:', httpParams.toString());

  return this.http.get<any>(fullUrl, { 
    params: httpParams
  }).pipe(
    tap(response => {
      console.log('=== RESPUESTA CRUDA DEL SERVIDOR ===');
      console.log('Respuesta completa:', response);
      console.log('Tipo de respuesta:', typeof response);
      console.log('Es array?', Array.isArray(response));
      if (response && response.data) {
        console.log('response.data:', response.data);
        console.log('response.data es array?', Array.isArray(response.data));
        console.log('Longitud de response.data:', response.data.length);
      }
    }),
    map(response => {
      let data = [];
      
      if (Array.isArray(response)) {
        data = response;
        console.log('Formato: Array directo');
      } else if (response && Array.isArray(response.data)) {
        data = response.data;
        console.log('Formato: response.data array');
      } else if (response && response.success && Array.isArray(response.data)) {
        data = response.data;
        console.log('Formato: response.success con data array');
      } else {
        console.warn('Formato de respuesta inesperado:', response);
        data = [];
      }
      
      console.log(`=== DATOS PROCESADOS: ${data.length} POIs ===`);
      if (data.length > 0) {
        console.log('Primer POI:', data[0]);
      }
      return data;
    }),
    catchError(error => {
      console.error('=== ERROR en getPublicCustomPois ===');
      console.error('Error completo:', error);
      console.error('Status:', error.status);
      console.error('Status Text:', error.statusText);
      console.error('URL:', error.url);
      console.error('Message:', error.message);
      
      if (error.error) {
        console.error('Error body:', error.error);
      }
      
      return of([]);
    })
  );
}
  getCustomPoiById(id: string): Observable<any> {
    return this.http.get<{ success: boolean; poi: any }>(`${this.apiUrl}/custom-pois/${id}`, this.getHttpOptions())
      .pipe(
        map(response => response.poi),
        catchError(this.handleError)
      );
  }

  createCustomPoi(poiData: {
    name: string;
    description: string;
    category: string;
    image: string;
    imageType: 'url' | 'camera';
    latitude: number;
    longitude: number;
    createdFromLocation?: { latitude: number; longitude: number };
  }): Observable<ApiResponse & { poi?: any }> {
    return this.http.post<ApiResponse & { poi?: any }>(`${this.apiUrl}/custom-pois`, poiData, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getUserCustomPois(): Observable<any[]> {
    return this.http.get<{ success: boolean; pois: any[] }>(`${this.apiUrl}/custom-pois/my/pois`, this.getHttpOptions())
      .pipe(
        map(response => response.pois || []),
        catchError(this.handleError)
      );
  }

  updateCustomPoi(id: string, poiData: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/custom-pois/${id}`, poiData, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  deleteCustomPoi(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/custom-pois/${id}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value && this.tokenService.hasValidToken();
  }

  private handleError = (error: any): Observable<never> => {
    console.error('HTTP Error:', error);
    
    if (error.status === 401) {
      this.tokenService.clearAll();
      this.currentUserSubject.next(null);
    }
    
    return throwError(() => ({
      success: false,
      message: error.error?.message || 'Ha ocurrido un error',
      status: error.status
    }));
  };
}