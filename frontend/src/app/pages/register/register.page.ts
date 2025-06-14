import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonButton, IonSpinner, 
  AlertController
} from '@ionic/angular/standalone';

import { CustomInputComponent } from '../../components/custom-input/custom-input.component';
import { PasswordValidatorComponent, PasswordChecks } from '../../components/password-validator/password-validator.component';
import { AvatarUploadComponent } from '../../components/avatar-upload/avatar-upload.component';
import { ValidationService } from '../../services/validation.service';
import { ToastService } from '../../services/toast.service'; // Nuevo servicio

interface RegisterData {
  username: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  description: string;
  avatar: string;
}

interface FieldErrors {
  username: string[];
  name: string[];
  email: string[];
  password: string[];
  confirmPassword: string[];
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonButton, IonSpinner,
    CommonModule, FormsModule,
    CustomInputComponent, PasswordValidatorComponent, AvatarUploadComponent
  ]
})
export class RegisterPage implements OnInit {

  registerData: RegisterData = {
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    description: '',
    avatar: ''
  };

  fieldErrors: FieldErrors = {
    username: [],
    name: [],
    email: [],
    password: [],
    confirmPassword: []
  };

  passwordChecks: PasswordChecks = {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  };

  isLoading = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private validationService: ValidationService,
    private toastService: ToastService // Nuevo servicio
  ) {}

  ngOnInit() {
    setTimeout(() => {
      const container = document.querySelector('.register-container');
      container?.classList.add('animate-in');
    }, 100);
  }

  validateField(fieldName: keyof FieldErrors) {
    this.fieldErrors[fieldName] = [];

    switch (fieldName) {
      case 'username':
        const usernameValidation = this.validationService.validateRequired(this.registerData.username, 'El usuario');
        this.fieldErrors.username = usernameValidation.errors;
        break;

      case 'name':
        const nameValidation = this.validationService.validateRequired(this.registerData.name, 'El nombre');
        this.fieldErrors.name = nameValidation.errors;
        break;

      case 'email':
        const emailValidation = this.validationService.validateEmail(this.registerData.email);
        this.fieldErrors.email = emailValidation.errors;
        break;

      case 'password':
        const passwordValidation = this.validationService.validatePassword(this.registerData.password);
        this.fieldErrors.password = passwordValidation.errors;
        break;

      case 'confirmPassword':
        const confirmValidation = this.validationService.validatePasswordMatch(
          this.registerData.password, 
          this.registerData.confirmPassword
        );
        this.fieldErrors.confirmPassword = confirmValidation.errors;
        break;
    }
  }

  validateAllFields() {
    Object.keys(this.fieldErrors).forEach(field => {
      this.validateField(field as keyof FieldErrors);
    });
  }

  onPasswordChange() {
    this.passwordChecks = this.validationService.getPasswordChecks(this.registerData.password);
    this.validateField('password');
    if (this.registerData.confirmPassword) {
      this.validateField('confirmPassword');
    }
  }

  validatePasswordMatch() {
    this.validateField('confirmPassword');
  }

  isFormValid(): boolean {
    return Object.values(this.fieldErrors).every(errors => errors.length === 0) &&
           this.registerData.username.trim() !== '' &&
           this.registerData.name.trim() !== '' &&
           this.registerData.email.trim() !== '' &&
           this.registerData.password !== '' &&
           this.registerData.confirmPassword !== '' &&
           Object.values(this.passwordChecks).every(check => check);
  }

  async onRegister() {
    this.validateAllFields();

    if (!this.isFormValid()) {
      const missingFields = this.getMissingFields();
      await this.toastService.showValidationError(missingFields);
      return;
    }

    this.isLoading = true;
    const loadingToast = await this.toastService.loading('Creando tu cuenta...');

    try {
      await this.simulateRegister();
      await loadingToast.dismiss();
      await this.toastService.success('¡Registro exitoso! Bienvenido a SpotGuide 🎉');
      
      // Pequeño delay para mostrar el éxito antes de navegar
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1500);
    } catch (error) {
      await loadingToast.dismiss();
      await this.toastService.error('Hubo un problema al registrarte. Inténtalo de nuevo.');
      await this.showAlert('Error', 'Hubo un problema al registrarte. Inténtalo de nuevo.');
    } finally {
      this.isLoading = false;
    }
  }

  // Método para manejar errores de avatar
  async onAvatarError(errorMessage: string) {
    await this.toastService.warning(errorMessage);
  }

  private getMissingFields(): string[] {
    const missingFields: string[] = [];
    
    if (!this.registerData.username.trim()) missingFields.push('Usuario');
    if (!this.registerData.name.trim()) missingFields.push('Nombre');
    if (!this.registerData.email.trim()) missingFields.push('Email');
    if (!this.registerData.password) missingFields.push('Contraseña');
    if (!this.registerData.confirmPassword) missingFields.push('Confirmar Contraseña');
    
    return missingFields;
  }

  private async simulateRegister(): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simular error ocasional para testing
        if (Math.random() < 0.1) { // 10% chance de error
          reject(new Error('Error simulado'));
        } else {
          console.log('Registrando usuario:', this.registerData);
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