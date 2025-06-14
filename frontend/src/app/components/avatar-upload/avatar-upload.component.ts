import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera } from 'ionicons/icons';

@Component({
  selector: 'app-avatar-upload',
  templateUrl: './avatar-upload.component.html',
  styleUrls: ['./avatar-upload.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AvatarUploadComponent),
      multi: true
    }
  ]
})
export class AvatarUploadComponent implements ControlValueAccessor {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  @Input() label = 'Avatar';
  @Input() uploadText = 'Sube o hazte una foto';
  @Input() changeText = 'Pulsa para cambiar imagen';
  @Input() altText = 'Avatar preview';
  @Input() maxSize = 5; // MB
  
  @Output() imageSelected = new EventEmitter<string>();
  @Output() imageError = new EventEmitter<string>();

  selectedImage: string | null = null;

  private onChange = (value: string) => {};
  private onTouched = () => {};

  constructor(private toastController: ToastController) {
    addIcons({ camera });
  }

  selectImage() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > this.maxSize * 1024 * 1024) {
        this.imageError.emit(`La imagen es demasiado grande. Máximo ${this.maxSize}MB.`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        this.imageError.emit('Por favor selecciona una imagen válida.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImage = e.target?.result as string;
        this.onChange(this.selectedImage);
        this.imageSelected.emit(this.selectedImage);
      };
      reader.readAsDataURL(file);
    }
  }

  writeValue(value: string): void {
    this.selectedImage = value || null;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}