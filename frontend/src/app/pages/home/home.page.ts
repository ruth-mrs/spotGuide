import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader
} from '@ionic/angular/standalone';

import { CustomButtonComponent } from '../../components/custom-button/custom-button.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader,
    CommonModule, FormsModule, CustomButtonComponent
  ]
})
export class HomePage implements OnInit {
  isLoggedIn = false; // Cambiar según tu lógica de autenticación

  constructor(private router: Router) {}

  ngOnInit() {
    // Verificar estado de autenticación
    this.checkAuthStatus();
  }

  private checkAuthStatus() {
    // Aquí puedes verificar si el usuario está logueado
    // Por ejemplo, verificando un token en localStorage
    const token = localStorage.getItem('auth_token');
    this.isLoggedIn = !!token;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}