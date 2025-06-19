import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonButton, IonSpinner,
  AlertController } from '@ionic/angular/standalone';

import { CustomInputComponent } from '../../components/custom-input/custom-input.component';
import { AvatarUploadComponent } from '../../components/avatar-upload/avatar-upload.component';
import { ValidationService } from '../../services/validation.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';

interface EditProfileData {
  name: string;
  description: string;
  avatar: string;
}

interface FieldErrors {
  name: string[];
  description: string[];
}

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
  standalone: true,
  imports: [ 
    IonContent, IonButton, IonSpinner, 
    CommonModule, FormsModule,
    CustomInputComponent, AvatarUploadComponent
  ]
})
export class EditProfilePage implements OnInit {
  editProfileData: EditProfileData = {
    name: '',
    description: '',
    avatar: ''
  };

  fieldErrors: FieldErrors = {
    name: [],
    description: []
  };

  isLoading = false;
  hasChanges = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private validationService: ValidationService,
    private toastService: ToastService,
    private authService: AuthService,
    private httpService: HttpService
  ) {}

   ngOnInit() {
    console.log('EditProfilePage: Component initialized');
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.log('EditProfilePage: No user found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    console.log('EditProfilePage: Loading user data:', currentUser);
    // Cargar datos actuales del usuario
    this.editProfileData = {
      name: currentUser.name,
      description: currentUser.description || '',
      avatar: currentUser.avatar || 'assets/avatars/default-avatar.png'
    };

    // Detectar cambios
    this.detectChanges();
  }

  private detectChanges() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const originalData = {
      name: currentUser.name,
      description: currentUser.description || '',
      avatar: currentUser.avatar || 'assets/avatars/default-avatar.png'
    };

    this.hasChanges = 
      this.editProfileData.name !== originalData.name ||
      this.editProfileData.description !== originalData.description ||
      this.editProfileData.avatar !== originalData.avatar;
  }

  onDataChange() {
    this.detectChanges();
  }

  validateField(field: keyof FieldErrors) {
    this.fieldErrors[field] = [];

    switch (field) {
      case 'name':
        if (!this.editProfileData.name.trim()) {
          this.fieldErrors.name.push('El nombre es requerido');
        } else if (this.editProfileData.name.trim().length < 2) {
          this.fieldErrors.name.push('El nombre debe tener al menos 2 caracteres');
        } else if (this.editProfileData.name.trim().length > 50) {
          this.fieldErrors.name.push('El nombre no puede exceder 50 caracteres');
        }
        break;

      case 'description':
        if (this.editProfileData.description.length > 500) {
          this.fieldErrors.description.push('La descripción no puede exceder 500 caracteres');
        }
        break;
    }
  }

  validateAllFields() {
    this.validateField('name');
    this.validateField('description');
  }

  isFormValid(): boolean {
    this.validateAllFields();
    return Object.values(this.fieldErrors).every(errors => errors.length === 0) && 
           this.editProfileData.name.trim().length > 0;
  }

  async onSaveChanges() {
    this.validateAllFields();

    if (!this.isFormValid()) {
      await this.toastService.error('Por favor corrige los errores en el formulario');
      return;
    }

    if (!this.hasChanges) {
      await this.toastService.info('No hay cambios para guardar');
      return;
    }

    this.isLoading = true;
    const loadingToast = await this.toastService.loading('Actualizando perfil...');

    try {
      const updateData = {
        name: this.editProfileData.name.trim(),
        description: this.editProfileData.description.trim(),
        avatar: this.editProfileData.avatar
      };

      const result = await this.httpService.updateProfile(updateData).toPromise();

      await loadingToast.dismiss();

      if (result?.success) {
        await this.toastService.success('Perfil actualizado exitosamente 🎉');
        
        // Volver a la página anterior
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 1500);
      } else {
        await this.toastService.error(result?.message || 'Error al actualizar perfil');
      }
    } catch (error) {
      await loadingToast.dismiss();
      console.error('Update profile error:', error);
      await this.toastService.error('Error de conexión. Verifica tu conexión a internet.');
    } finally {
      this.isLoading = false;
    }
  }

  async onCancel() {
    if (this.hasChanges) {
      const alert = await this.alertController.create({
        header: '¿Descartar cambios?',
        message: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Descartar',
            handler: () => {
              this.router.navigate(['/profile']);
            }
          }
        ]
      });

      await alert.present();
    } else {
      this.router.navigate(['/profile']);
    }
  }

  async onAvatarError(errorMessage: string) {
    await this.toastService.warning(errorMessage);
  }
}