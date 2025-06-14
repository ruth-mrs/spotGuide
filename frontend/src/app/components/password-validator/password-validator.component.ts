import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeCircle } from 'ionicons/icons';

export interface PasswordChecks {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
}

@Component({
  selector: 'app-password-validator',
  templateUrl: './password-validator.component.html',
  styleUrls: ['./password-validator.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon]
})
export class PasswordValidatorComponent {
  @Input() checks: PasswordChecks = {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  };
  @Input() showValidator = false;

  constructor() {
    addIcons({ checkmarkCircle, closeCircle });
  }
}