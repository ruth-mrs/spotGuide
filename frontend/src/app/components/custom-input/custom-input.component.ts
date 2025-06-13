import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonInput, IonTextarea, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eye, eyeOff } from 'ionicons/icons';

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
  @Input() rows = 3; // Para textarea
  
  @Output() inputChange = new EventEmitter<string>();
  @Output() inputBlur = new EventEmitter<void>();

  value = '';
  showPassword = false;
  actualType = 'text';

  private onChange = (value: string) => {};
  private onTouched = () => {};

  constructor() {
    addIcons({ eye, eyeOff });
  }

  ngOnInit() {
    this.actualType = this.type;
  }

  onInput(event: any) {
    this.value = event.target.value;
    this.onChange(this.value);
    this.inputChange.emit(this.value);
  }

  onBlur() {
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
}