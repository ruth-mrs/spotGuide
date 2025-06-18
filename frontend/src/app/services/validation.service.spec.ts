import { TestBed } from '@angular/core/testing'
import { ValidationService } from './validation.service'

describe('ValidationService', () => {
  let service: ValidationService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(ValidationService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should validate email correctly', () => {
    expect(service.validateEmail('test@test.com').isValid).toBe(true)
    expect(service.validateEmail('invalid-email').isValid).toBe(false)
    expect(service.validateEmail('').isValid).toBe(false)
  })

  it('should validate password correctly', () => {
    const validPassword = service.validatePassword('Password123')
    expect(validPassword.isValid).toBe(true)

    const invalidPassword = service.validatePassword('weak')
    expect(invalidPassword.isValid).toBe(false)
    expect(invalidPassword.errors.length).toBeGreaterThan(0)
  })

  it('should validate password match', () => {
    const match = service.validatePasswordMatch('password123', 'password123')
    expect(match.isValid).toBe(true)

    const noMatch = service.validatePasswordMatch('password123', 'different')
    expect(noMatch.isValid).toBe(false)
  })

  it('should validate required fields', () => {
    const valid = service.validateRequired('test value', 'Test Field')
    expect(valid.isValid).toBe(true)

    const invalid = service.validateRequired('', 'Test Field')
    expect(invalid.isValid).toBe(false)
    expect(invalid.errors[0]).toContain('Test Field es requerido')
  })

  it('should get password checks', () => {
    const checks = service.getPasswordChecks('Password123')
    expect(checks.length).toBe(true)
    expect(checks.uppercase).toBe(true)
    expect(checks.lowercase).toBe(true)
    expect(checks.number).toBe(true)
  })
})