import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  @Input() showBack = false;
  @Input() showSearch = true;
  @Input() searchPlaceholder = 'Buscar puntos de interés...';
  @Input() searchValue = '';
  @Input() isGlobalSearch = true;
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
    
    // Solo emitir searchChange si NO es búsqueda global
    if (!this.isGlobalSearch) {
      this.searchChange.emit(query);
    }
  }

  onEnterKeyUp(event: any) {
    console.log('Toolbar: Enter key up detected');
    console.log('Event details:', event);
    event.preventDefault();
    event.stopPropagation();
    this.executeSearch();
  }

  onSearchButtonClick() {
    console.log('Toolbar: Search button clicked');
    this.executeSearch();
  }

  private executeSearch() {
    const query = this.searchValue.trim();
    console.log('Toolbar: EXECUTING SEARCH with query:', query);
    
    // Emitir evento de búsqueda
    this.searchSubmit.emit(query);
  }

  // Método público para limpiar la búsqueda
  clearSearch() {
    this.searchValue = '';
    console.log('Toolbar: Search cleared');
    
    if (this.isGlobalSearch) {
      this.searchSubmit.emit('');
    } else {
      this.searchChange.emit('');
      this.searchSubmit.emit('');
    }
  }
}