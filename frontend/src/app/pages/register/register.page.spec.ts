import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RegisterPage } from './register.page';
import { AuthService } from '../../services/auth.service';
import { ValidationService } from '../../services/validation.service';
import { ToastService } from '../../services/toast.service';
import { of, throwError } from 'rxjs';

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockValidationService: jasmine.SpyObj<ValidationService>;

  beforeEach(async () => {
    // ✅ Crear spy completo del AuthService con todos los métodos
    const authSpy = jasmine.createSpyObj('AuthService', [
      'register', 
      'isLoggedIn',
      'login',
      'logout',
      'getCurrentUser'
    ]);
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    const toastSpy = jasmine.createSpyObj('ToastService', [
      'success', 
      'error', 
      'warning',
      'loading',
      'showValidationError'
    ]);

    const validationSpy = jasmine.createSpyObj('ValidationService', [
      'validateRequired',
      'validateEmail', 
      'validatePassword',
      'validatePasswordMatch',
      'getPasswordChecks'
    ]);

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), FormsModule, RegisterPage],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: ValidationService, useValue: validationSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    mockValidationService = TestBed.inject(ValidationService) as jasmine.SpyObj<ValidationService>;

    // ✅ Configurar valores por defecto de los mocks
    mockAuthService.isLoggedIn.and.returnValue(false);
    
    // Mock de validation service responses
    mockValidationService.validateRequired.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.validateEmail.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.validatePassword.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.validatePasswordMatch.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.getPasswordChecks.and.returnValue({
      length: true,
      uppercase: true,
      lowercase: true,
      number: true
    });

    // Mock de toast loading
    const mockLoadingToast = {
      dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve())
    };
    mockToastService.loading.and.returnValue(Promise.resolve(mockLoadingToast as any));
    mockToastService.success.and.returnValue(Promise.resolve({} as any));
    mockToastService.error.and.returnValue(Promise.resolve({} as any));
    mockToastService.showValidationError.and.returnValue(Promise.resolve({} as any));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to pois if already logged in', () => {
    // Arrange
    mockAuthService.isLoggedIn.and.returnValue(true);
    
    // Act
    component.ngOnInit();
    
    // Assert
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/pois']);
  });

  it('should not redirect if not logged in', () => {
    // Arrange
    mockAuthService.isLoggedIn.and.returnValue(false);
    
    // Act
    component.ngOnInit();
    
    // Assert
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should validate all fields', () => {
    // Arrange
    component.registerData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@test.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      description: 'Test description',
      avatar: ''
    };

    // Configure validation mocks to return valid responses
    mockValidationService.validateRequired.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.validateEmail.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.validatePassword.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.validatePasswordMatch.and.returnValue({ isValid: true, errors: [] });
    
    // Act
    component.validateAllFields();
    
    // Assert
    expect(component.isFormValid()).toBe(true);
    expect(mockValidationService.validateRequired).toHaveBeenCalled();
    expect(mockValidationService.validateEmail).toHaveBeenCalled();
    expect(mockValidationService.validatePassword).toHaveBeenCalled();
    expect(mockValidationService.validatePasswordMatch).toHaveBeenCalled();
  });

  it('should validate password match', () => {
    // Arrange
    component.registerData.password = 'Password123';
    component.registerData.confirmPassword = 'DifferentPassword';
    
    // Configure mock to return error for mismatched passwords
    mockValidationService.validatePasswordMatch.and.returnValue({ 
      isValid: false, 
      errors: ['Las contraseñas no coinciden'] 
    });
    
    // Act
    component.validatePasswordMatch();
    
    // Assert
    expect(mockValidationService.validatePasswordMatch).toHaveBeenCalledWith('Password123', 'DifferentPassword');
    expect(component.fieldErrors.confirmPassword.length).toBeGreaterThan(0);
  });

  it('should update password checks', () => {
    // Arrange
    const expectedChecks = {
      length: true,
      uppercase: true,
      lowercase: true,
      number: true
    };
    
    component.registerData.password = 'Password123';
    mockValidationService.getPasswordChecks.and.returnValue(expectedChecks);
    mockValidationService.validatePassword.and.returnValue({ isValid: true, errors: [] });
    
    // Act
    component.onPasswordChange();
    
    // Assert
    expect(mockValidationService.getPasswordChecks).toHaveBeenCalledWith('Password123');
    expect(component.passwordChecks).toEqual(expectedChecks);
    expect(component.passwordChecks.length).toBe(true);
    expect(component.passwordChecks.uppercase).toBe(true);
    expect(component.passwordChecks.lowercase).toBe(true);
    expect(component.passwordChecks.number).toBe(true);
  });

  it('should register successfully', fakeAsync(async () => {
  // Arrange
  component.registerData = {
    username: 'testuser',
    name: 'Test User',
    email: 'test@test.com',
    password: 'Password123',
    confirmPassword: 'Password123',
    description: 'Test description',
    avatar: ''
  };

  // ✅ CLAVE: Limpiar errores de validación para que el formulario sea válido
  component.fieldErrors = {
    username: [],
    name: [],
    email: [],
    password: [],
    confirmPassword: []
  };

  // ✅ Configurar password checks para que sea válido
  component.passwordChecks = {
    length: true,
    uppercase: true,
    lowercase: true,
    number: true
  };

  const mockResponse = { 
    success: true, 
    message: 'Registration successful', 
    token: 'test-token' 
  };
  mockAuthService.register.and.returnValue(of(mockResponse));

  // Act
  await component.onRegister();

  // Assert service call
  expect(mockAuthService.register).toHaveBeenCalledWith({
    username: 'testuser',
    name: 'Test User',
    email: 'test@test.com',
    password: 'Password123',
    description: 'Test description',
    avatar: ''
  });

  expect(mockToastService.success).toHaveBeenCalledWith('Registration successful');
  
  // ✅ Simular el paso del tiempo para el setTimeout
  tick(1600);
  
  expect(mockRouter.navigate).toHaveBeenCalledWith(['/pois']);
}));

  it('should handle registration error', async () => {
    // Arrange
    component.registerData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@test.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      description: 'Test description',
      avatar: ''
    };

    // ✅ CLAVE: Limpiar errores de validación para que el formulario sea válido
    component.fieldErrors = {
      username: [],
      name: [],
      email: [],
      password: [],
      confirmPassword: []
    };

    // ✅ Configurar password checks para que sea válido
    component.passwordChecks = {
      length: true,
      uppercase: true,
      lowercase: true,
      number: true
    };

    // Configure validations to pass
    mockValidationService.validateRequired.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.validateEmail.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.validatePassword.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.validatePasswordMatch.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.getPasswordChecks.and.returnValue({
      length: true, uppercase: true, lowercase: true, number: true
    });

    // Mock registration failure
    const errorResponse = { success: false, message: 'El usuario ya existe' };
    mockAuthService.register.and.returnValue(of(errorResponse));

    // Act
    await component.onRegister();

    // Assert
    expect(mockAuthService.register).toHaveBeenCalled();
    expect(mockToastService.error).toHaveBeenCalledWith('El usuario ya existe');
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should handle network error during registration', async () => {
    // Arrange
    component.registerData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@test.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      description: 'Test description',
      avatar: ''
    };

    // ✅ CLAVE: Limpiar errores de validación para que el formulario sea válido
    component.fieldErrors = {
      username: [],
      name: [],
      email: [],
      password: [],
      confirmPassword: []
    };

    // ✅ Configurar password checks para que sea válido
    component.passwordChecks = {
      length: true,
      uppercase: true,
      lowercase: true,
      number: true
    };

    // Configure validations to pass
    mockValidationService.validateRequired.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.validateEmail.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.validatePassword.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.validatePasswordMatch.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.getPasswordChecks.and.returnValue({
      length: true, uppercase: true, lowercase: true, number: true
    });

    // Mock network error
    mockAuthService.register.and.returnValue(throwError(() => new Error('Network error')));

    // Act
    await component.onRegister();

    // Assert
    expect(mockAuthService.register).toHaveBeenCalled();
    expect(mockToastService.error).toHaveBeenCalledWith('Error de conexión. Verifica tu conexión a internet.');
    expect(component.isLoading).toBe(false);
  });

  it('should not register with invalid form', async () => {
    // Arrange
    component.registerData = {
      username: '',
      name: '',
      email: 'invalid-email',
      password: 'weak',
      confirmPassword: 'different',
      description: '',
      avatar: ''
    };

    // ✅ CLAVE: Configurar errores de validación para que el formulario sea inválido
    component.fieldErrors = {
      username: ['Campo requerido'],
      name: ['Campo requerido'],
      email: ['Email inválido'],
      password: ['Contraseña muy débil'],
      confirmPassword: ['Las contraseñas no coinciden']
    };

    // ✅ Configurar password checks para que sea inválido
    component.passwordChecks = {
      length: false,
      uppercase: false,
      lowercase: true,
      number: false
    };

    // Configure validations to fail
    mockValidationService.validateRequired.and.returnValue({ isValid: false, errors: ['Campo requerido'] });
    mockValidationService.validateEmail.and.returnValue({ isValid: false, errors: ['Email inválido'] });
    mockValidationService.validatePassword.and.returnValue({ isValid: false, errors: ['Contraseña muy débil'] });
    mockValidationService.validatePasswordMatch.and.returnValue({ isValid: false, errors: ['Las contraseñas no coinciden'] });

    // Act
    await component.onRegister();

    // Assert
    expect(mockToastService.showValidationError).toHaveBeenCalled();
    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  it('should validate individual fields correctly', () => {
    // Arrange
    component.registerData.email = 'invalid-email';
    mockValidationService.validateEmail.and.returnValue({ 
      isValid: false, 
      errors: ['Por favor ingresa un email válido'] 
    });

    // Act
    component.validateField('email');

    // Assert
    expect(mockValidationService.validateEmail).toHaveBeenCalledWith('invalid-email');
    expect(component.fieldErrors.email).toEqual(['Por favor ingresa un email válido']);
  });

  it('should handle avatar error', async () => {
    // Arrange
    const errorMessage = 'Error al subir la imagen';

    // Act
    await component.onAvatarError(errorMessage);

    // Assert
    expect(mockToastService.warning).toHaveBeenCalledWith(errorMessage);
  });

  it('should identify missing fields correctly', () => {
    // Arrange
    component.registerData = {
      username: '',
      name: 'Test',
      email: '',
      password: 'Password123',
      confirmPassword: '',
      description: '',
      avatar: ''
    };

    // Act
    const missingFields = (component as any).getMissingFields();

    // Assert
    expect(missingFields).toContain('Usuario');
    expect(missingFields).toContain('Email');
    expect(missingFields).toContain('Confirmar Contraseña');
    expect(missingFields).not.toContain('Nombre');
    expect(missingFields).not.toContain('Contraseña');
  });

  // ✅ NUEVO TEST: Verificar que isFormValid() funciona correctamente
  it('should return correct form validity', () => {
    // Test form invalid - con errores
    component.fieldErrors = {
      username: ['Error'],
      name: [],
      email: [],
      password: [],
      confirmPassword: []
    };
    component.registerData = {
      username: 'test',
      name: 'Test',
      email: 'test@test.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      description: '',
      avatar: ''
    };
    component.passwordChecks = {
      length: true,
      uppercase: true,
      lowercase: true,
      number: true
    };
    
    expect(component.isFormValid()).toBe(false);
    
    // Test form valid - sin errores
    component.fieldErrors = {
      username: [],
      name: [],
      email: [],
      password: [],
      confirmPassword: []
    };
    
    expect(component.isFormValid()).toBe(true);
  });

  // ✅ NUEVO TEST: Verificar que todos los campos requeridos estén llenos
  it('should validate required fields are filled', () => {
    // Campos vacíos
    component.registerData = {
      username: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      description: '',
      avatar: ''
    };
    
    const missingFields = (component as any).getMissingFields();
    expect(missingFields.length).toBeGreaterThan(0);
    
    // Campos llenos
    component.registerData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@test.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      description: 'Test desc',
      avatar: ''
    };
    
    const noMissingFields = (component as any).getMissingFields();
    expect(noMissingFields.length).toBe(0);
  });

  // ✅ NUEVO TEST: Verificar que password checks son válidos
  it('should validate password strength checks', () => {
    // Password débil
    component.passwordChecks = {
      length: false,
      uppercase: false,
      lowercase: true,
      number: false
    };
    
    expect(component.isFormValid()).toBe(false);
    
    // Password fuerte
    component.passwordChecks = {
      length: true,
      uppercase: true,
      lowercase: true,
      number: true
    };
    component.fieldErrors = {
      username: [],
      name: [],
      email: [],
      password: [],
      confirmPassword: []
    };
    component.registerData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@test.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      description: '',
      avatar: ''
    };
    
    expect(component.isFormValid()).toBe(true);
  });
});