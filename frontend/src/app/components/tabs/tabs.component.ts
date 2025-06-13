import { Component, OnInit } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, compass, add, list, person } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonLabel,
    IonIcon
  ],
  styleUrls: ['./tabs.component.scss'],
})
export class TabsComponent implements OnInit {
  constructor() {
    addIcons({ home, compass, add, list, person });
  }

  ngOnInit() { }
  isLoggedIn = true;

  userAvatarUrl = 'https://www.forpasgastronomia.com/FitxersWeb/25473/temporada-de-aguacates.jpg';
}
