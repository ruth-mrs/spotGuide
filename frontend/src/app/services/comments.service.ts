import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpService } from './http.service';
import { AuthService } from './auth.service';
import { catchError, map } from 'rxjs/operators';

export interface Comment {
  id: string;
  poiId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  text: string;
  date: Date;
  isOwn?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private commentsSubject = new BehaviorSubject<Comment[]>([]);
  public comments$ = this.commentsSubject.asObservable();

  constructor(
    private httpService: HttpService,
    private authService: AuthService
  ) {}

  // Obtener comentarios de un POI específico
  getCommentsByPoiId(poiId: string): Observable<Comment[]> {
    console.log(`CommentsService: Obteniendo comentarios para POI ${poiId}`);
    
    return this.httpService.getCommentsByPoi(poiId).pipe(
      map(comments => {
        const currentUser = this.authService.getCurrentUser();
        return comments.map(comment => ({
          ...comment,
          date: new Date(comment.date),
          isOwn: currentUser ? comment.userId === currentUser.id : false
        }));
      }),
      catchError(error => {
        console.error('CommentsService: Error obteniendo comentarios:', error);
        return of([]);
      })
    );
  }

  // Añadir comentario
  addComment(
    poiId: string,
    poiName: string,
    poiLocation: { lat: number; lng: number },
    poiCategory: string,
    poiImage: string,
    userId: string,
    userName: string,
    userAvatar: string,
    rating: number,
    text: string
  ): Observable<{ success: boolean; comment?: Comment; message: string }> {
    console.log(`CommentsService: Añadiendo comentario para POI ${poiId}`);
    
    // Determinar tipo de POI
    const poiType: 'custom' | 'foursquare' = poiId.startsWith('custom_') || (poiId.length === 24 && !poiId.startsWith('4')) ? 'custom' : 'foursquare';
    
    const commentData = {
      poiId,
      poiName,
      poiType,
      rating,
      text: text.trim()
    };

    return this.httpService.addComment(commentData).pipe(
      map(response => {
        if (response.success) {
          return {
            success: true,
            comment: response.comment ? {
              ...response.comment,
              date: new Date(response.comment.date)
            } : undefined,
            message: response.message
          };
        }
        return {
          success: false,
          message: response.message
        };
      }),
      catchError(error => {
        console.error('CommentsService: Error añadiendo comentario:', error);
        return of({
          success: false,
          message: error.message || 'Error añadiendo comentario'
        });
      })
    );
  }

  // Obtener comentarios del usuario
  getUserComments(): Observable<Comment[]> {
    return this.httpService.getUserComments().pipe(
      map(comments => comments.map(comment => ({
        ...comment,
        date: new Date(comment.date)
      }))),
      catchError(error => {
        console.error('CommentsService: Error obteniendo comentarios del usuario:', error);
        return of([]);
      })
    );
  }

  // Obtener estadísticas de un POI
  getPoiStats(poiId: string): Observable<{ averageRating: number; totalComments: number }> {
    return this.getCommentsByPoiId(poiId).pipe(
      map(comments => {
        if (comments.length === 0) {
          return { averageRating: 0, totalComments: 0 };
        }

        const totalRating = comments.reduce((sum, comment) => sum + comment.rating, 0);
        const averageRating = totalRating / comments.length;

        return {
          averageRating: Math.round(averageRating * 10) / 10,
          totalComments: comments.length
        };
      })
    );
  }
}