import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

export interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'middle' | 'bottom';
  showCloseButton?: boolean;
  icon?: string;
  translucent?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private toastController: ToastController) {}

  private getToastConfig(options: ToastOptions) {
    const config = {
      message: options.message,
      duration: options.duration || 4000,
      position: options.position || 'top',
      translucent: options.translucent !== false,
      cssClass: this.getToastClass(options.type || 'info'),
      buttons: options.showCloseButton ? [
        {
          text: '✕',
          role: 'cancel',
          cssClass: 'toast-close-btn'
        }
      ] : undefined
    };

    return config;
  }

  private getToastClass(type: string): string {
    const baseClass = 'modern-toast';
    const typeClass = `toast-${type}`;
    return `${baseClass} ${typeClass}`;
  }

  async show(options: ToastOptions) {
    const config = this.getToastConfig(options);
    const toast = await this.toastController.create(config);
    await toast.present();
    return toast;
  }

  async success(message: string, duration = 3000) {
    return this.show({
      message,
      type: 'success',
      duration,
      icon: 'checkmark-circle'
    });
  }

  async error(message: string, duration = 4000) {
    return this.show({
      message,
      type: 'error',
      duration,
      icon: 'alert-circle',
      showCloseButton: true
    });
  }

  async warning(message: string, duration = 4000) {
    return this.show({
      message,
      type: 'warning',
      duration,
      icon: 'warning',
      showCloseButton: true
    });
  }

  async info(message: string, duration = 3000) {
    return this.show({
      message,
      type: 'info',
      duration,
      icon: 'information-circle'
    });
  }

  async loading(message = 'Cargando...') {
    return this.show({
      message,
      type: 'info',
      duration: 0, // No se cierra automáticamente
      showCloseButton: false
    });
  }

  async showValidationError(missingFields: string[]) {
    const message = missingFields.length > 0 
      ? `Faltan campos requeridos: ${missingFields.join(', ')}`
      : 'Por favor corrige los errores en el formulario';
    
    return this.warning(message);
  }

  async dismiss() {
    const toast = await this.toastController.getTop();
    if (toast) {
      await toast.dismiss();
    }
  }
}