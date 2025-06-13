import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddPoiPage } from './add-poi.page';

describe('AddPoiPage', () => {
  let component: AddPoiPage;
  let fixture: ComponentFixture<AddPoiPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPoiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
