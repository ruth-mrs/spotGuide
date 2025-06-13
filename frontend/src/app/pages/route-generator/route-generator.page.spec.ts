import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouteGeneratorPage } from './route-generator.page';

describe('RouteGeneratorPage', () => {
  let component: RouteGeneratorPage;
  let fixture: ComponentFixture<RouteGeneratorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RouteGeneratorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
