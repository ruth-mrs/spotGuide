import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { FormsModule } from '@angular/forms'
import { LoginPage } from './login.page'
import { AuthService } from '../../services/auth.service'
import { ValidationService } from '../../services/validation.service'
import { ToastService } from '../../services/toast.service'
import { of, throwError } from 'rxjs'

describe('LoginPage', () => {
  let component: LoginPage
  let fixture: ComponentFixture<LoginPage>
  let mockAuthService: jasmine.SpyObj<AuthService>
  let mockRouter: jasmine.SpyObj<Router>
  let mockToastService: jasmine.SpyObj<ToastService>

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login'])
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'loading', 'warning'])

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), FormsModule, LoginPage],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastService, useValue: toastSpy },
        ValidationService
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(LoginPage)
    component = fixture.componentInstance
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should validate email field', () => {
    component.loginData.email = 'invalid-email'
    component.validateField('email')
    expect(component.fieldErrors.email.length).toBeGreaterThan(0)

    component.loginData.email = 'valid@email.com'
    component.validateField('email')
    expect(component.fieldErrors.email.length).toBe(0)
  })

  it('should validate password field', () => {
    component.loginData.password = ''
    component.validateField('password')
    expect(component.fieldErrors.password.length).toBeGreaterThan(0)

    component.loginData.password = 'validpassword'
    component.validateField('password')
    expect(component.fieldErrors.password.length).toBe(0)
  })

  it('should check if form is valid', () => {
    component.loginData = { email: 'test@test.com', password: 'password123' }
    component.validateAllFields()
    expect(component.isFormValid()).toBe(true)
  })

  it('should login successfully', async () => {
    component.loginData = { email: 'test@test.com', password: 'password123' }
    
    const mockResponse = { success: true, token: 'test-token', message: 'Login successful' }
    mockAuthService.login.and.returnValue(of(mockResponse))
    mockToastService.loading.and.returnValue(Promise.resolve({ dismiss: () => Promise.resolve() } as any))
    mockToastService.success.and.returnValue(Promise.resolve({ dismiss: () => Promise.resolve() } as any))

    await component.onLogin()

    expect(mockAuthService.login).toHaveBeenCalledWith('test@test.com', 'password123')
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home'])
  })

  it('should handle login error', async () => {
    component.loginData = { email: 'test@test.com', password: 'wrongpassword' }
    
    mockAuthService.login.and.returnValue(throwError('Login failed'))
    mockToastService.loading.and.returnValue(Promise.resolve({ dismiss: () => Promise.resolve() } as any))
    mockToastService.error.and.returnValue(Promise.resolve({ dismiss: () => Promise.resolve() } as any))

    await component.onLogin()

    expect(mockToastService.error).toHaveBeenCalled()
    expect(component.isLoading).toBe(false)
  })
})