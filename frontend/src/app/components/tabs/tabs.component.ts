import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterLinkActive } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, homeOutline, compass, compassOutline, add, addCircle, addCircleOutline, list, person } from 'ionicons/icons';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    RouterLinkActive
  ],
  styleUrls: ['./tabs.component.scss'],
  standalone: true
})
export class TabsComponent implements OnInit {
  isHomeActive = false;
  isRouteActive = false;
  isAddActive = false;
  isPoisActive = false;
  isProfileActive = false;
  isLoggedIn = true;
  userAvatarUrl = 'https://www.forpasgastronomia.com/FitxersWeb/25473/temporada-de-aguacates.jpg';

  constructor(private router: Router) {
    addIcons({ 
      home, 
      homeOutline, 
      compass, 
      compassOutline, 
      add, 
      addCircle, 
      addCircleOutline, 
      list, 
      person 
    });
  }

  ngOnInit() { 
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateActiveStates(event.url);
    });
    
    // Set initial state
    this.updateActiveStates(this.router.url);
  }

  private updateActiveStates(url: string) {
    this.isHomeActive = url === '/' || url === '/home';
    this.isRouteActive = url === '/generate-route';
    this.isAddActive = url === '/add-poi';
    this.isPoisActive = url === '/pois';
    this.isProfileActive = url === '/profile';
  }
}