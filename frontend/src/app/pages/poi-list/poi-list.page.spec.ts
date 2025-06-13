import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoiListPage } from './poi-list.page';

describe('PoiListPage', () => {
  let component: PoiListPage;
  let fixture: ComponentFixture<PoiListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PoiListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
