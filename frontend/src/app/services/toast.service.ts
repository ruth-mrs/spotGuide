import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeCircle, warning, informationCircle, sync } from 'ionicons/icons';

export interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
  duration?: number;
  position?: 'top' | 'middle' | 'bottom';
  showCloseButton?: boolean;
  persistent?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private toastController: ToastController) {
    // Registrar todos los iconos necesarios
    addIcons({
      'checkmark-circle': checkmarkCircle,
      'close-circle': closeCircle,
      'warning': warning,
      'information-circle': informationCircle,
      'sync': sync
    });
  }

  private getDefaultDuration(type: string): number {
    switch (type) {
      case 'success': return 3500;
      case 'error': return 5000;
      case 'warning': return 4500;
      case 'info': return 3000;
      case 'loading': return 0;
      default: return 3000;
    }
  }

  private getToastIcon(type: string): string {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      case 'loading': return 'sync';
      default: return 'information-circle';
    }
  }

  private getToastConfig(options: ToastOptions) {
    const type = options.type || 'info';
    
    return {
      message: options.message,
      duration: options.persistent ? 0 : (options.duration || this.getDefaultDuration(type)),
      position: options.position || 'top',
      translucent: true,
      cssClass: `modern-toast toast-${type}`,
      icon: this.getToastIcon(type),
      buttons: options.showCloseButton ? [
        {
          text: 'Cerrar',
          role: 'cancel',
          handler: () => {
            console.log('Toast cerrado por el usuario');
          }
        }
      ] : undefined
    };
  }

  async show(options: ToastOptions) {
    const config = this.getToastConfig(options);
    const toast = await this.toastController.create(config);
    await toast.present();
    return toast;
  }

  async success(message: string, duration?: number) {
    return this.show({
      message,
      type: 'success',
      duration
    });
  }

  async error(message: string, duration?: number, persistent = false) {
    return this.show({
      message,
      type: 'error',
      duration,
      persistent,
      showCloseButton: persistent
    });
  }

  async warning(message: string, duration?: number) {
    return this.show({
      message,
      type: 'warning',
      duration,
      showCloseButton: true
    });
  }

  async info(message: string, duration?: number) {
    return this.show({
      message,
      type: 'info',
      duration
    });
  }

  async loading(message = 'Procesando...', persistent = true) {
    return this.show({
      message,
      type: 'loading',
      persistent,
      showCloseButton: false
    });
  }

  async showValidationError(missingFields: string[]) {
    const message = missingFields.length > 0 
      ? `Faltan campos: ${missingFields.join(', ')}`
      : 'Revisa los errores del formulario';
    
    return this.warning(message, 4000);
  }

  async dismiss() {
    const toast = await this.toastController.getTop();
    if (toast) {
      await toast.dismiss();
    }
  }

  async dismissAll() {
    let toast = await this.toastController.getTop();
    while (toast) {
      await toast.dismiss();
      toast = await this.toastController.getTop();
    }
  }
}