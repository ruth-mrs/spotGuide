import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { AddPoiPage } from './add-poi.page';

describe('AddPoiPage', () => {
  let component: AddPoiPage;
  let fixture: ComponentFixture<AddPoiPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        IonicModule.forRoot(),
        AddPoiPage // Importar en lugar de declarar
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddPoiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});