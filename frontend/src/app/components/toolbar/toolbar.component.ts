import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonButton, IonIcon, IonSearchbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, search } from 'ionicons/icons';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, IonSearchbar],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {
  private router = inject(Router);
  
  @Input() showBack = false;
  @Input() showSearch = true;
  @Input() searchPlaceholder = 'Buscar lugares, restaurantes, monumentos...';
  @Input() searchValue = '';
  @Input() currentLocation: { lat: number; lng: number } = { lat: 36.8377, lng: -2.4585 };
  
  @Output() back = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<string>();

  constructor() {
    addIcons({ 'arrow-back': arrowBack, search });
  }

  onBack() {
    console.log('Toolbar: Back button clicked');
    this.back.emit();
  }

  onSearchInput(ev: any) {
    const query = ev.detail.value || '';
    this.searchValue = query;
    console.log('Toolbar: Search input changed:', query);
    this.searchChange.emit(query);
  }

  onEnterKeyUp(event: any) {
    console.log('Toolbar: Enter key up detected');
    event.preventDefault();
    event.stopPropagation();
    this.executeGlobalSearch();
  }

  onSearchButtonClick() {
    console.log('Toolbar: Search button clicked');
    this.executeGlobalSearch();
  }

  private executeGlobalSearch() {
    const query = this.searchValue.trim();
    const currentRoute = this.router.url;
    
    console.log('Toolbar: EXECUTING SEARCH with query:', query, 'from route:', currentRoute);
    
    if (query.length === 0) {
      // Si está vacío, comportamiento según la vista
      if (currentRoute.includes('/profile')) {
        // En perfil, limpiar filtros locales
        this.searchSubmit.emit('');
        return;
      } else {
        // En otras vistas, ir a poi-list normal
        this.router.navigate(['/pois']);
        return;
      }
    }

    if (currentRoute.includes('/profile')) {
      console.log('Toolbar: Búsqueda local en perfil');
      this.searchSubmit.emit(query); 
    } else {
      console.log('Toolbar: Búsqueda global → poi-list');
      this.router.navigate(['/pois'], {
        queryParams: {
          search: query,
          lat: this.currentLocation.lat,
          lng: this.currentLocation.lng
        }
      });
      this.searchSubmit.emit(query);
    }
  }

  // Método público para limpiar la búsqueda
  clearSearch() {
    this.searchValue = '';
    console.log('Toolbar: Search cleared');
    this.searchChange.emit('');
    this.searchSubmit.emit('');
  }

  // Método público para establecer una búsqueda desde el componente padre
  setSearchValue(value: string) {
    this.searchValue = value;
  }
}