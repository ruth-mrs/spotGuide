import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { PoiCardComponent } from './poi-card.component';

describe('PoiCardComponent', () => {
  let component: PoiCardComponent;
  let fixture: ComponentFixture<PoiCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        PoiCardComponent // Importar en lugar de declarar
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoiCardComponent);
    component = fixture.componentInstance;
    
    // Proporcionar datos de prueba requeridos
    component.poi = {
      id: 'test-poi',
      name: 'Test POI',
      description: 'Test description',
      image: 'test-image.jpg',
      rating: 4.5,
      reviewCount: 10,
      category: 'Test Category',
      distance: '1.2 km',
      estimatedTime: '15 min',
      latitude: 36.8377,
      longitude: -2.4585,
      isFavorite: false
    };
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});