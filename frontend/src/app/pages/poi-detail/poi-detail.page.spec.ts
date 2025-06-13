import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoiDetailPage } from './poi-detail.page';

describe('PoiDetailPage', () => {
  let component: PoiDetailPage;
  let fixture: ComponentFixture<PoiDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PoiDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
