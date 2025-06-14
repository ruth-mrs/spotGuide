import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface Comment {
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

interface PoiInfo {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  image?: string;
  firstCommentDate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private comments: Comment[] = [];
  private poisInfo: PoiInfo[] = [];
  
  private commentsSubject = new BehaviorSubject<Comment[]>([]);
  public comments$ = this.commentsSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  // Obtener comentarios de un POI específico
  getCommentsByPoiId(poiId: string): Observable<Comment[]> {
    const poiComments = this.comments.filter(comment => comment.poiId === poiId);
    return new BehaviorSubject(poiComments).asObservable();
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
  ): void {
    console.log(`CommentsService: Añadiendo comentario para POI ${poiId}`);
    
    // Guardar información del POI si es la primera vez
    if (!this.poisInfo.find(poi => poi.id === poiId)) {
      const poiInfo: PoiInfo = {
        id: poiId,
        name: poiName,
        latitude: poiLocation.lat,
        longitude: poiLocation.lng,
        category: poiCategory,
        image: poiImage,
        firstCommentDate: new Date()
      };
      
      this.poisInfo.push(poiInfo);
      console.log(`CommentsService: Información del POI guardada: ${poiName}`);
    }

    // Crear comentario
    const comment: Comment = {
      id: Date.now().toString(),
      poiId: poiId,
      userId: userId,
      userName: userName,
      userAvatar: userAvatar,
      rating: rating,
      text: text.trim(),
      date: new Date(),
      isOwn: true
    };

    this.comments.unshift(comment);
    this.saveToStorage();
    this.commentsSubject.next([...this.comments]);
    
    console.log(`CommentsService: Comentario añadido. Total comentarios: ${this.comments.length}`);
  }

  // Obtener información de POIs con comentarios
  getPoisWithComments(): PoiInfo[] {
    return [...this.poisInfo];
  }

  // Obtener estadísticas de un POI
  getPoiStats(poiId: string): { averageRating: number; totalComments: number } {
    const poiComments = this.comments.filter(comment => comment.poiId === poiId);
    
    if (poiComments.length === 0) {
      return { averageRating: 0, totalComments: 0 };
    }

    const totalRating = poiComments.reduce((sum, comment) => sum + comment.rating, 0);
    const averageRating = totalRating / poiComments.length;

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalComments: poiComments.length
    };
  }

  private loadFromStorage(): void {
    try {
      const commentsData = localStorage.getItem('spotguide_comments');
      const poisData = localStorage.getItem('spotguide_pois_info');
      
      if (commentsData) {
        this.comments = JSON.parse(commentsData).map((comment: any) => ({
          ...comment,
          date: new Date(comment.date)
        }));
      }
      
      if (poisData) {
        this.poisInfo = JSON.parse(poisData).map((poi: any) => ({
          ...poi,
          firstCommentDate: new Date(poi.firstCommentDate)
        }));
      }
      
      console.log(`CommentsService: Cargados ${this.comments.length} comentarios y ${this.poisInfo.length} POIs desde storage`);
    } catch (error) {
      console.error('CommentsService: Error cargando desde storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('spotguide_comments', JSON.stringify(this.comments));
      localStorage.setItem('spotguide_pois_info', JSON.stringify(this.poisInfo));
      console.log('CommentsService: Datos guardados en storage');
    } catch (error) {
      console.error('CommentsService: Error guardando en storage:', error);
    }
  }
}