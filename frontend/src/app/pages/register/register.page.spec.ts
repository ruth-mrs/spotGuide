import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { FormsModule } from '@angular/forms'
import { RegisterPage } from './register.page'
import { AuthService } from '../../services/auth.service'
import { ValidationService } from '../../services/validation.service'
import { ToastService } from '../../services/toast.service'
import { of, throwError } from 'rxjs'

describe('RegisterPage', () => {
  let component: RegisterPage
  let fixture: ComponentFixture<RegisterPage>
  let mockAuthService: jasmine.SpyObj<AuthService>
  let mockRouter: jasmine.SpyObj<Router>
  let mockToastService: jasmine.SpyObj<ToastService>

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['register'])
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'loading'])

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), FormsModule, RegisterPage],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastService, useValue: toastSpy },
        ValidationService
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(RegisterPage)
    component = fixture.componentInstance
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should validate all fields', () => {
    component.registerData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@test.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      description: 'Test description',
      avatar: ''
    }
    
    component.validateAllFields()
    expect(component.isFormValid()).toBe(true)
  })

  it('should validate password match', () => {
    component.registerData.password = 'Password123'
    component.registerData.confirmPassword = 'DifferentPassword'
    
    component.validatePasswordMatch()
    expect(component.fieldErrors.confirmPassword.length).toBeGreaterThan(0)
  })

  it('should update password checks', () => {
    component.registerData.password = 'Password123'
    component.onPasswordChange()
    
    expect(component.passwordChecks.length).toBe(true)
    expect(component.passwordChecks.uppercase).toBe(true)
    expect(component.passwordChecks.lowercase).toBe(true)
    expect(component.passwordChecks.number).toBe(true)
  })

  it('should register successfully', async () => {
    component.registerData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@test.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      description: 'Test description',
      avatar: ''
    }

    const mockResponse = { success: true, message: 'Registration successful', token: 'test-token' }
    mockAuthService.register.and.returnValue(of(mockResponse))
    mockToastService.loading.and.returnValue(Promise.resolve({ dismiss: () => Promise.resolve() } as any))
    mockToastService.success.and.returnValue(Promise.resolve({ dismiss: () => Promise.resolve() } as any))

    await component.onRegister()

    expect(mockAuthService.register).toHaveBeenCalled()
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home'])
  })
})