import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonButton, IonIcon, IonSearchbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [IonButton, IonIcon, IonSearchbar],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {
  @Input() showBack = false;
  @Input() showSearch = true;
  @Input() searchPlaceholder = 'Buscar...';
  @Output() back = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();

  onBack() {
    this.back.emit();
  }

  onSearchChange(ev: any) {
    this.searchChange.emit(ev.detail.value);
  }
}