import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolbarComponent } from 'src/app/components/toolbar/toolbar.component';

import { 
  IonHeader, 
  IonContent, 
  IonButton
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    IonContent, 
    IonHeader, 
    IonButton,
    ToolbarComponent,
    CommonModule, 
    FormsModule
  ],
})
export class HomePage implements OnInit {
  isLoggedIn = true;

  constructor() {
  }

  ngOnInit() {
  }
}