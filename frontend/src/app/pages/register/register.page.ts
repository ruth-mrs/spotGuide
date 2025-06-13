import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonButton, IonSpinner, 
  AlertController, ToastController 
} from '@ionic/angular/standalone';

import { CustomInputComponent } from '../../components/custom-input/custom-input.component';
import { PasswordValidatorComponent, PasswordChecks } from '../../components/password-validator/password-validator.component';
import { AvatarUploadComponent } from '../../components/avatar-upload/avatar-upload.component';
import { ValidationService } from '../../services/validation.service';

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
    private toastController: ToastController,
    private validationService: ValidationService
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
      if (missingFields.length > 0) {
        await this.showToast(`Faltan campos requeridos: ${missingFields.join(', ')}`, 'warning');
      } else {
        await this.showToast('Por favor corrige los errores en el formulario', 'warning');
      }
      return;
    }

    this.isLoading = true;

    try {
      await this.simulateRegister();
      await this.showToast('¡Registro exitoso! Bienvenido a SpotGuide', 'success');
      this.router.navigate(['/home']);
    } catch (error) {
      await this.showAlert('Error', 'Hubo un problema al registrarte. Inténtalo de nuevo.');
    } finally {
      this.isLoading = false;
    }
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
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Registrando usuario:', this.registerData);
        resolve();
      }, 2000);
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      cssClass: 'custom-toast'
    });
    await toast.present();
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