import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonInput, IonTextarea, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eye, eyeOff, alertCircle } from 'ionicons/icons';

@Component({
  selector: 'app-custom-input',
  templateUrl: './custom-input.component.html',
  styleUrls: ['./custom-input.component.scss'],
  standalone: true,
  imports: [CommonModule, IonInput, IonTextarea, IonButton, IonIcon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomInputComponent),
      multi: true
    }
  ]
})
export class CustomInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() required = false;
  @Input() optional = false;
  @Input() hasError = false;
  @Input() errorMessage = '';
  @Input() rows = 4; // Para textarea
  @Input() maxLength?: number; // Límite de caracteres - ESTA LÍNEA ES IMPORTANTE
  @Input() autoGrow = true; // Auto-resize para textarea
  @Input() counter = false; // Mostrar contador de caracteres
  @Input() disabled = false; // Deshabilitar input
  @Input() readonly = false; // Solo lectura
  
  @Output() inputChange = new EventEmitter<string>();
  @Output() inputBlur = new EventEmitter<void>();
  @Output() inputFocus = new EventEmitter<void>();

  value = '';
  showPassword = false;
  actualType = 'text';
  isFocused = false;

  private onChange = (value: string) => {};
  private onTouched = () => {};

  constructor() {
    addIcons({ eye, eyeOff, alertCircle });
  }

  ngOnInit() {
    this.actualType = this.type;
  }

  get isTextarea(): boolean {
    return this.type === 'textarea';
  }

  get characterCount(): number {
    return this.value?.length || 0;
  }

  get isOverLimit(): boolean {
    return this.maxLength ? this.characterCount > this.maxLength : false;
  }

  get isNearLimit(): boolean {
    if (!this.maxLength) return false;
    return this.characterCount >= this.maxLength * 0.8;
  }

  onInput(event: any) {
    const inputValue = event.target.value;
    
    // Aplicar límite de caracteres si está definido
    if (this.maxLength && inputValue.length > this.maxLength) {
      const truncatedValue = inputValue.substring(0, this.maxLength);
      this.value = truncatedValue;
      // Actualizar el valor en el DOM
      event.target.value = truncatedValue;
    } else {
      this.value = inputValue;
    }
    
    this.onChange(this.value);
    this.inputChange.emit(this.value);
  }

  onFocus() {
    this.isFocused = true;
    this.inputFocus.emit();
  }

  onBlur() {
    this.isFocused = false;
    this.onTouched();
    this.inputBlur.emit();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.actualType = this.showPassword ? 'text' : 'password';
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}