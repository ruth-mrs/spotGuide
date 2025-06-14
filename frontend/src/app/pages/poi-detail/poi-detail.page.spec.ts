import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule } from '@ionic/angular';
import { PoiDetailPage } from './poi-detail.page';

describe('PoiDetailPage', () => {
  let component: PoiDetailPage;
  let fixture: ComponentFixture<PoiDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        IonicModule.forRoot(),
        PoiDetailPage // Importar en lugar de declarar
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoiDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});