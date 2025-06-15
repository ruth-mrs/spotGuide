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
import { AuthService } from '../../services/auth.service';

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
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Verificar si ya está logueado
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/pois']);
      return;
    }

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
      const result = await this.authService.login(this.loginData.email, this.loginData.password).toPromise();
      
      await loadingToast.dismiss();
      
      if (result?.success) {
        await this.toastService.success('¡Bienvenido de vuelta! 🎉');
        
        // Pequeño delay para mostrar el éxito antes de navegar
        setTimeout(() => {
          this.router.navigate(['/pois']);
        }, 1500);
      } else {
        await this.toastService.error(result?.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      await loadingToast.dismiss();
      console.error('Login error:', error);
      await this.toastService.error('Error de conexión. Verifica tu conexión a internet.');
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

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}