import { Injectable } from '@angular/core';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email || email.trim() === '') {
      errors.push('El email es requerido');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('El formato del email no es válido');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('La contraseña es requerida');
    } else {
      if (password.length < 8) {
        errors.push('La contraseña debe tener al menos 8 caracteres');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('La contraseña debe contener al menos una mayúscula');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('La contraseña debe contener al menos una minúscula');
      }
      if (!/\d/.test(password)) {
        errors.push('La contraseña debe contener al menos un número');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
    const errors: string[] = [];
    
    if (!confirmPassword) {
      errors.push('Debes confirmar tu contraseña');
    } else if (password !== confirmPassword) {
      errors.push('Las contraseñas no coinciden');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateRequired(value: string, fieldName: string): ValidationResult {
    const errors: string[] = [];
    
    if (!value || value.trim() === '') {
      errors.push(`${fieldName} es requerido`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getPasswordChecks(password: string) {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password)
    };
  }
}