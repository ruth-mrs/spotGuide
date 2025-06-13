import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TabsComponent } from './components/tabs/tabs.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, TabsComponent, ToolbarComponent],
})
export class AppComponent implements OnInit {
  toolbarConfig = {
    showBack: false,
    showSearch: false
  };

  constructor(
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    // Escuchar cambios de ruta para actualizar la configuración del toolbar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateToolbarConfig(event.url);
    });

    // Configuración inicial
    this.updateToolbarConfig(this.router.url);
  }

  private updateToolbarConfig(url: string) {
  // Resetear configuración por defecto
  this.toolbarConfig = {
    showBack: false,
    showSearch: false
  };

  // Configurar según la ruta
  switch (url) {
    case '/':
    case '/home':
      this.toolbarConfig = { showBack: false, showSearch: true };
      break;
    case '/pois':
      this.toolbarConfig = { showBack: false, showSearch: true };
      break;
    case '/profile':
      this.toolbarConfig = { showBack: false, showSearch: false };
      break;
    case '/add-poi':
      this.toolbarConfig = { showBack: true, showSearch: false };
      break;
    case '/generate-route':
      this.toolbarConfig = { showBack: true, showSearch: false };
      break;
    case '/register':
    case '/login':
      this.toolbarConfig = { showBack: true, showSearch: false }; // Cambio aquí
      break;
    default:
      // Para rutas dinámicas como /poi/:id
      if (url.startsWith('/poi/')) {
        this.toolbarConfig = { showBack: true, showSearch: false };
      }
      // Por defecto mostrar solo back
      else {
        this.toolbarConfig = { showBack: true, showSearch: false };
      }
      break;
  }
}

  onBack() {
    this.location.back();
  }

  onSearchChange(searchTerm: string) {
    // Aquí puedes implementar la lógica de búsqueda global
    // o emitir un evento que las páginas puedan escuchar
    console.log('Búsqueda global:', searchTerm);
  }
}