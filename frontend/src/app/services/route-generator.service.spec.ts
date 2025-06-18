import { TestBed } from '@angular/core/testing';

import { RouteGeneratorService } from './route-generator.service';

describe('RouteGeneratorService', () => {
  let service: RouteGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RouteGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
