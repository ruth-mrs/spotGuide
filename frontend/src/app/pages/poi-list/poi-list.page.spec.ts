import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule } from '@ionic/angular';
import { PoiListPage } from './poi-list.page';

describe('PoiListPage', () => {
  let component: PoiListPage;
  let fixture: ComponentFixture<PoiListPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        IonicModule.forRoot(),
        PoiListPage // Importar en lugar de declarar
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoiListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});