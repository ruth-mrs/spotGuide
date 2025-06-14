import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FoursquareService } from './foursquare.service';

describe('FoursquareService', () => {
  let service: FoursquareService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Añadir HttpClientTestingModule
      providers: [FoursquareService]
    });
    service = TestBed.inject(FoursquareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});