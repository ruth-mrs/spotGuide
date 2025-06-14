import { TestBed } from '@angular/core/testing';

import { FoursquareService } from './foursquare.service';

describe('FoursquareService', () => {
  let service: FoursquareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FoursquareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
