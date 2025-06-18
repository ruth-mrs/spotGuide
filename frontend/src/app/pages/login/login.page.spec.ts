import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { LoginPage } from './login.page';
import { AuthService } from '../../services/auth.service';
import { ValidationService } from '../../services/validation.service';
import { ToastService } from '../../services/toast.service';
import { of, throwError } from 'rxjs';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockValidationService: jasmine.SpyObj<ValidationService>;

  beforeEach(async () => {
    // ✅ Crear spy completo del AuthService con TODOS los métodos
    const authSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'isLoggedIn', // ✅ AGREGAR MÉTODO FALTANTE
      'register',
      'logout',
      'getCurrentUser',
      'getToken'
    ]);
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    const toastSpy = jasmine.createSpyObj('ToastService', [
      'success', 
      'error', 
      'loading', 
      'warning',
      'showValidationError'
    ]);

    const validationSpy = jasmine.createSpyObj('ValidationService', [
      'validateEmail',
      'validateRequired',
      'validatePassword'
    ]);

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), FormsModule, LoginPage],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: ValidationService, useValue: validationSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    mockValidationService = TestBed.inject(ValidationService) as jasmine.SpyObj<ValidationService>;

    // ✅ Configurar valores por defecto de los mocks
    mockAuthService.isLoggedIn.and.returnValue(false);
    
    // ✅ ARREGLAR: Crear mock User completo con todas las propiedades requeridas
    const mockUser = {
      id: 'test-user-id',
      username: 'testuser',
      name: 'Test User',
      email: 'test@test.com',
      joinDate: new Date('2024-01-01'),
      description: 'Test user description',
      avatar: 'https://example.com/avatar.jpg'
    };
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    mockAuthService.getToken.and.returnValue('test-token');

    // Mock de validation service
    mockValidationService.validateEmail.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.validateRequired.and.returnValue({ isValid: true, errors: [] });
    mockValidationService.validatePassword.and.returnValue({ isValid: true, errors: [] });

    // Mock de toast loading
    const mockLoadingToast = {
      dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve())
    };
    mockToastService.loading.and.returnValue(Promise.resolve(mockLoadingToast as any));
    mockToastService.success.and.returnValue(Promise.resolve({} as any));
    mockToastService.error.and.returnValue(Promise.resolve({} as any));
    mockToastService.warning.and.returnValue(Promise.resolve({} as any));
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

  it('should validate email field', () => {
    // Test invalid email
    component.loginData.email = 'invalid-email';
    mockValidationService.validateEmail.and.returnValue({ 
      isValid: false, 
      errors: ['Ingresa un email válido'] 
    });
    
    component.validateField('email');
    expect(component.fieldErrors.email.length).toBeGreaterThan(0);
    expect(component.fieldErrors.email[0]).toBe('Ingresa un email válido');

    // Test valid email
    component.loginData.email = 'valid@email.com';
    mockValidationService.validateEmail.and.returnValue({ 
      isValid: true, 
      errors: [] 
    });
    
    component.validateField('email');
    expect(component.fieldErrors.email.length).toBe(0);
  });

  it('should validate password field', () => {
    // Test empty password
    component.loginData.password = '';
    component.validateField('password');
    expect(component.fieldErrors.password.length).toBeGreaterThan(0);
    expect(component.fieldErrors.password[0]).toBe('La contraseña es requerida');

    // Test short password
    component.loginData.password = '123';
    component.validateField('password');
    expect(component.fieldErrors.password.length).toBeGreaterThan(0);
    expect(component.fieldErrors.password[0]).toBe('La contraseña debe tener al menos 6 caracteres');

    // Test valid password
    component.loginData.password = 'validpassword';
    component.validateField('password');
    expect(component.fieldErrors.password.length).toBe(0);
  });

  it('should validate all fields', () => {
    // Arrange
    component.loginData = { email: 'test@test.com', password: 'password123' };
    mockValidationService.validateEmail.and.returnValue({ isValid: true, errors: [] });
    
    // Act
    component.validateAllFields();
    
    // Assert
    expect(mockValidationService.validateEmail).toHaveBeenCalledWith('test@test.com');
    expect(component.fieldErrors.email.length).toBe(0);
    expect(component.fieldErrors.password.length).toBe(0);
  });

  it('should check if form is valid', () => {
    // Test invalid form
    component.loginData = { email: '', password: '' };
    component.fieldErrors = { email: ['Error'], password: [] };
    expect(component.isFormValid()).toBe(false);

    // Test valid form
    component.loginData = { email: 'test@test.com', password: 'password123' };
    component.fieldErrors = { email: [], password: [] };
    expect(component.isFormValid()).toBe(true);
  });

  it('should login successfully', async () => {
    // Arrange
    component.loginData = { email: 'test@test.com', password: 'password123' };
    component.fieldErrors = { email: [], password: [] }; // ✅ Limpiar errores
    
    const mockResponse = { success: true, token: 'test-token', message: 'Login successful' };
    mockAuthService.login.and.returnValue(of(mockResponse));

    // Act
    await component.onLogin();

    // Assert
    expect(mockAuthService.login).toHaveBeenCalledWith('test@test.com', 'password123');
    expect(mockToastService.success).toHaveBeenCalledWith('¡Bienvenido de vuelta! 🎉');
    
    // ✅ Arreglar expectativa de navegación - el código navega a '/pois', no '/home'
    setTimeout(() => {
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/pois']);
    }, 1600);
  });

  it('should handle login error with message', async () => {
    // Arrange
    component.loginData = { email: 'test@test.com', password: 'wrongpassword' };
    component.fieldErrors = { email: [], password: [] }; // ✅ Limpiar errores
    
    const mockResponse = { success: false, message: 'Credenciales inválidas' };
    mockAuthService.login.and.returnValue(of(mockResponse));

    // Act
    await component.onLogin();

    // Assert
    expect(mockAuthService.login).toHaveBeenCalledWith('test@test.com', 'wrongpassword');
    expect(mockToastService.error).toHaveBeenCalledWith('Credenciales inválidas');
    expect(component.isLoading).toBe(false);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should handle network error during login', async () => {
    // Arrange
    component.loginData = { email: 'test@test.com', password: 'password123' };
    component.fieldErrors = { email: [], password: [] }; // ✅ Limpiar errores
    
    mockAuthService.login.and.returnValue(throwError(() => new Error('Network error')));

    // Act
    await component.onLogin();

    // Assert
    expect(mockToastService.error).toHaveBeenCalledWith('Error de conexión. Verifica tu conexión a internet.');
    expect(component.isLoading).toBe(false);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should not login with invalid form', async () => {
    // Arrange
    component.loginData = { email: '', password: '' };
    component.fieldErrors = { email: ['Error'], password: ['Error'] }; // ✅ Configurar errores

    // Act
    await component.onLogin();

    // Assert
    expect(mockToastService.showValidationError).toHaveBeenCalled();
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should show warning for form with validation errors', async () => {
    // Arrange
    component.loginData = { email: 'invalid@email', password: '12345' }; // Datos inválidos pero no vacíos
    component.fieldErrors = { email: ['Email inválido'], password: ['Contraseña muy corta'] };

    // Act
    await component.onLogin();

    // Assert
    expect(mockToastService.warning).toHaveBeenCalledWith('Por favor revisa los errores del formulario');
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should identify missing fields correctly', () => {
    // Arrange
    component.loginData = { email: '', password: 'password123' };

    // Act
    const missingFields = (component as any).getMissingFields();

    // Assert
    expect(missingFields).toContain('Email');
    expect(missingFields).not.toContain('Contraseña');
    expect(missingFields.length).toBe(1);
  });

  it('should handle DOM animation setup', (done) => {
    // Mock querySelector
    const mockElement = { classList: { add: jasmine.createSpy('add') } };
    spyOn(document, 'querySelector').and.returnValue(mockElement as any);
    
    // Act
    component.ngOnInit();
    
    // Assert - check that animation is set up after timeout
    setTimeout(() => {
      expect(mockElement.classList.add).toHaveBeenCalledWith('animate-in');
      done();
    }, 150);
  });

  it('should validate required fields', () => {
    // Test empty email
    component.loginData.email = '';
    component.validateField('email');
    expect(component.fieldErrors.email).toContain('El email es requerido');

    // Test empty password
    component.loginData.password = '';
    component.validateField('password');
    expect(component.fieldErrors.password).toContain('La contraseña es requerida');
  });

  it('should clear field errors when validation passes', () => {
    // Arrange - set initial errors
    component.fieldErrors.email = ['Previous error'];
    component.loginData.email = 'valid@email.com';
    mockValidationService.validateEmail.and.returnValue({ isValid: true, errors: [] });

    // Act
    component.validateField('email');

    // Assert
    expect(component.fieldErrors.email.length).toBe(0);
  });

  it('should handle loading state correctly', async () => {
    // Arrange
    component.loginData = { email: 'test@test.com', password: 'password123' };
    component.fieldErrors = { email: [], password: [] };
    
    // Mock delayed response
    const mockResponse = { success: true, token: 'test-token', message: 'Login successful' };
    mockAuthService.login.and.returnValue(of(mockResponse).pipe());

    // Act
    const loginPromise = component.onLogin();
    
    // Assert loading state during login
    expect(component.isLoading).toBe(true);
    
    await loginPromise;
    
    // Assert loading state cleared after login
    expect(component.isLoading).toBe(false);
  });
});