import { TestBed } from '@angular/core/testing';

import { CustomPoiService } from './custom-poi.service';

describe('CustomPoiService', () => {
  let service: CustomPoiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomPoiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
