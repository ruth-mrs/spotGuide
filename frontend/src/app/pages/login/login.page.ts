import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonButton, IonSpinner, 
  AlertController
} from '@ionic/angular/standalone';

import { CustomInputComponent } from '../../components/custom-input/custom-input.component';
import { ValidationService } from '../../services/validation.service';
import { ToastService } from '../../services/toast.service';

interface LoginData {
  email: string;
  password: string;
}

interface FieldErrors {
  email: string[];
  password: string[];
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonButton, IonSpinner,
    CommonModule, FormsModule,
    CustomInputComponent
  ]
})
export class LoginPage implements OnInit {

  loginData: LoginData = {
    email: '',
    password: ''
  };

  fieldErrors: FieldErrors = {
    email: [],
    password: []
  };

  isLoading = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private validationService: ValidationService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    setTimeout(() => {
      const container = document.querySelector('.login-container');
      container?.classList.add('animate-in');
    }, 100);
  }

  validateField(fieldName: keyof FieldErrors) {
    this.fieldErrors[fieldName] = [];

    switch (fieldName) {
      case 'email':
        if (!this.loginData.email.trim()) {
          this.fieldErrors.email = ['El email es requerido'];
        } else if (!this.validationService.validateEmail(this.loginData.email).isValid) {
          this.fieldErrors.email = ['Ingresa un email válido'];
        }
        break;

      case 'password':
        if (!this.loginData.password) {
          this.fieldErrors.password = ['La contraseña es requerida'];
        } else if (this.loginData.password.length < 6) {
          this.fieldErrors.password = ['La contraseña debe tener al menos 6 caracteres'];
        }
        break;
    }
  }

  validateAllFields() {
    Object.keys(this.fieldErrors).forEach(field => {
      this.validateField(field as keyof FieldErrors);
    });
  }

  isFormValid(): boolean {
    return Object.values(this.fieldErrors).every(errors => errors.length === 0) &&
           this.loginData.email.trim() !== '' &&
           this.loginData.password !== '';
  }

  async onLogin() {
    this.validateAllFields();

    if (!this.isFormValid()) {
      const missingFields = this.getMissingFields();
      if (missingFields.length > 0) {
        await this.toastService.showValidationError(missingFields);
      } else {
        await this.toastService.warning('Por favor revisa los errores del formulario');
      }
      return;
    }

    this.isLoading = true;
    const loadingToast = await this.toastService.loading('Iniciando sesión...');

    try {
      await this.simulateLogin();
      await loadingToast.dismiss();
      await this.toastService.success('¡Bienvenido de vuelta! 🎉');
      
      // Pequeño delay para mostrar el éxito antes de navegar
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1500);
    } catch (error) {
      await loadingToast.dismiss();
      await this.toastService.error('Credenciales incorrectas. Verifica tu email y contraseña.');
    } finally {
      this.isLoading = false;
    }
  }

  private getMissingFields(): string[] {
    const missingFields: string[] = [];
    
    if (!this.loginData.email.trim()) missingFields.push('Email');
    if (!this.loginData.password) missingFields.push('Contraseña');
    
    return missingFields;
  }

  private async simulateLogin(): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simular error ocasional para testing
        if (Math.random() < 0.2) { // 20% chance de error
          reject(new Error('Credenciales incorrectas'));
        } else {
          console.log('Iniciando sesión:', this.loginData);
          resolve();
        }
      }, 2000);
    });
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}