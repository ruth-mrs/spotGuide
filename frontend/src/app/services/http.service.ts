import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { TokenService } from './token.service';

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

  // Favoritos
  getUserFavorites(): Observable<any[]> {
    return this.http.get<{ success: boolean; favorites: any[] }>(`${this.apiUrl}/favorites`, this.getHttpOptions())
      .pipe(
        map(response => response.favorites || []),
        catchError(this.handleError)
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
  }): Observable<ApiResponse & { isFavorite: boolean }> {
    return this.http.post<ApiResponse & { isFavorite: boolean }>(`${this.apiUrl}/favorites/toggle`, favoriteData, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  checkFavorite(poiId: string): Observable<{ isFavorite: boolean }> {
    return this.http.get<{ success: boolean; isFavorite: boolean }>(`${this.apiUrl}/favorites/check/${poiId}`, this.getHttpOptions())
      .pipe(
        map(response => ({ isFavorite: response.isFavorite })),
        catchError(() => throwError(() => ({ isFavorite: false })))
      );
  }

  getPublicCustomPois(params?: { page?: number; limit?: number; lat?: number; lng?: number; radius?: number }): Observable<any[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${this.apiUrl}/custom-pois/public${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.http.get<{ success: boolean; pois: any[] }>(url, this.getHttpOptions())
      .pipe(
        map(response => response.pois || []),
        catchError(this.handleError)
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