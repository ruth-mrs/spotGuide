import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, chevronForward } from 'ionicons/icons';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'success' | 'warning' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-custom-button',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  templateUrl: './custom-button.component.html',
  styleUrls: ['./custom-button.component.scss']
})
export class CustomButtonComponent {
  @Input() text: string = '';
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'medium';
  @Input() disabled: boolean = false;
  @Input() expand: 'block' | 'full' | undefined = 'block';
  @Input() icon: string = '';
  @Input() iconPosition: 'start' | 'end' | 'icon-only' = 'start';
  @Input() loading: boolean = false;

  @Output() buttonClick = new EventEmitter<void>();

  constructor() {
    addIcons({
      add,
      chevronForward
    });
  }

  onClick() {
    if (!this.disabled && !this.loading) {
      this.buttonClick.emit();
    }
  }

  get buttonClasses(): string {
    const classes = ['custom-button', `btn-${this.variant}`, `btn-${this.size}`];
    
    if (this.loading) {
      classes.push('btn-loading');
    }
    
    if (this.disabled) {
      classes.push('btn-disabled');
    }
    
    return classes.join(' ');
  }
}