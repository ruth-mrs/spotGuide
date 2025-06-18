import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FoursquareService } from './foursquare.service';
import { of } from 'rxjs';

describe('FoursquareService', () => {
  let service: FoursquareService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FoursquareService]
    });
    service = TestBed.inject(FoursquareService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should search nearby places', () => {
    const mockResponse = {
      results: [
        {
          fsq_id: 'test-id',
          name: 'Test Place',
          location: { formatted_address: 'Test Address' },
          geocodes: { main: { latitude: 36.8377, longitude: -2.4585 } },
          categories: [{ name: 'Restaurant', id: 'cat-id' }],
          rating: 4.5,
          distance: 150
        }
      ]
    };

    service.searchNearby(36.8377, -2.4585).subscribe(pois => {
      expect(pois.length).toBe(1);
      expect(pois[0].name).toBe('Test Place');
      expect(pois[0].rating).toBe(2.25); // 4.5/2 = 2.25 (convertido a escala 0-5)
    });

    // ✅ ARREGLAR: Usar URL exacta basada en la implementación real
    const req = httpMock.expectOne(req => 
      req.url.startsWith('https://api.foursquare.com/v3/places/search') &&
      req.url.includes('ll=36.8377,-2.4585') &&
      req.url.includes('radius=5000') &&
      req.url.includes('sort=DISTANCE')
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBeTruthy();
    req.flush(mockResponse);
  });

  it('should search by text', () => {
    const mockResponse = {
      results: [
        {
          fsq_id: 'test-id-2',
          name: 'Test Restaurant',
          location: { formatted_address: 'Test Address 2' },
          geocodes: { main: { latitude: 36.8400, longitude: -2.4600 } },
          categories: [{ name: 'Restaurant', id: 'rest-id' }],
          rating: 4.0,
          distance: 200
        }
      ]
    };

    service.searchByText('restaurant', 36.8377, -2.4585).subscribe(pois => {
      expect(pois.length).toBe(1);
      expect(pois[0].name).toBe('Test Restaurant');
      expect(pois[0].rating).toBe(2.0); // 4.0/2 = 2.0
    });

    // ✅ ARREGLAR: URL exacta para búsqueda por texto
    const req = httpMock.expectOne(req => 
      req.url.startsWith('https://api.foursquare.com/v3/places/search') &&
      req.url.includes('query=restaurant') &&
      req.url.includes('ll=36.8377,-2.4585') &&
      req.url.includes('sort=RELEVANCE')
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle search errors', () => {
    const consoleSpy = spyOn(console, 'error').and.stub();

    service.searchNearby(36.8377, -2.4585).subscribe(
      pois => {
        expect(pois).toEqual([]); // Debe retornar array vacío en caso de error
      },
      error => fail('Should not have error, should return empty array')
    );

    // ✅ ARREGLAR: Usar URL correcta para el mock
    const req = httpMock.expectOne(req => 
      req.url.startsWith('https://api.foursquare.com/v3/places/search') &&
      req.url.includes('ll=36.8377,-2.4585')
    );
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should search nearby with pagination', () => {
    const mockResponse = {
      pois: [
        {
          id: 'test-1',
          name: 'Test Place 1',
          latitude: 36.8377,
          longitude: -2.4585,
          rating: 4.0,
          category: 'restaurant',
          distance: '100 m',
          estimatedTime: '2 min'
        }
      ],
      total: 50,
      page: 1,
      pageSize: 12,
      hasMore: true
    };

    // Mock del cache interno del servicio
    spyOn<any>(service, 'paginateResults').and.returnValue(mockResponse);
    spyOn<any>(service, 'loadAllNearbyPois').and.returnValue(of([
      {
        id: 'test-1',
        name: 'Test Place 1',
        latitude: 36.8377,
        longitude: -2.4585,
        rating: 4.0,
        category: 'restaurant',
        distance: '100 m',
        estimatedTime: '2 min'
      }
    ]));

    service.searchNearbyPaginated(36.8377, -2.4585, 1, 12).subscribe(result => {
      expect(result.pois.length).toBe(1);
      expect(result.page).toBe(1);
      expect(result.hasMore).toBe(true);
    });
  });

  it('should get place details', () => {
    const mockPlaceDetails = {
      fsq_id: 'test-place-id',
      name: 'Detailed Place',
      location: { 
        formatted_address: 'Detailed Address',
        locality: 'Test City',
        region: 'Test Region'
      },
      geocodes: { main: { latitude: 36.8377, longitude: -2.4585 } },
      categories: [{ name: 'Restaurant', id: '4bf58dd8d48988d110941735' }],
      rating: 4.7,
      stats: { total_ratings: 150 },
      description: 'A great place to visit',
      website: 'https://example.com',
      tel: '+34123456789'
    };

    service.getVenueDetails('test-place-id').subscribe(details => {
      expect(details?.name).toBe('Detailed Place');
      expect(details?.rating).toBe(2.35); // 4.7/2 = 2.35
      expect(details?.description).toContain('A great place to visit');
    });

    const req = httpMock.expectOne(`https://api.foursquare.com/v3/places/test-place-id`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('fields')).toContain('fsq_id,name,location');
    req.flush(mockPlaceDetails);
  });

  it('should handle empty search results', () => {
    const mockEmptyResponse = { results: [] };

    service.searchNearby(36.8377, -2.4585).subscribe(pois => {
      expect(pois).toEqual([]);
      expect(pois.length).toBe(0);
    });

    const req = httpMock.expectOne(req => 
      req.url.startsWith('https://api.foursquare.com/v3/places/search')
    );
    req.flush(mockEmptyResponse);
  });

  it('should transform venue data correctly', () => {
    const mockResponse = {
      results: [
        {
          fsq_id: 'transform-test',
          name: 'Transform Test Place',
          location: { 
            formatted_address: 'Transform Address'
          },
          geocodes: {
            main: {
              latitude: 36.8377,
              longitude: -2.4585
            }
          },
          categories: [
            { name: 'Restaurant', id: '4bf58dd8d48988d110941735' },
            { name: 'Italian Restaurant', id: '4bf58dd8d48988d1e4931735' }
          ],
          rating: 4.2,
          distance: 150,
          stats: { total_ratings: 89 }
        }
      ]
    };

    service.searchNearby(36.8377, -2.4585).subscribe(pois => {
      const poi = pois[0];
      expect(poi.id).toBe('transform-test');
      expect(poi.name).toBe('Transform Test Place');
      expect(poi.latitude).toBe(36.8377);
      expect(poi.longitude).toBe(-2.4585);
      expect(poi.category).toBe('restaurant'); // Mapped from category name
      expect(poi.rating).toBe(2.1); // 4.2/2 = 2.1
      expect(poi.distance).toBe('150 m'); // Formatted distance
    });

    const req = httpMock.expectOne(req => 
      req.url.startsWith('https://api.foursquare.com/v3/places/search')
    );
    req.flush(mockResponse);
  });

  it('should handle missing optional fields in API response', () => {
    const mockResponseWithMissingFields = {
      results: [
        {
          fsq_id: 'minimal-data',
          name: 'Minimal Place',
          location: { formatted_address: 'Minimal Address' },
          geocodes: { main: { latitude: 36.8377, longitude: -2.4585 } }
          // Missing: rating, categories, distance, etc.
        }
      ]
    };

    service.searchNearby(36.8377, -2.4585).subscribe(pois => {
      const poi = pois[0];
      expect(poi.id).toBe('minimal-data');
      expect(poi.name).toBe('Minimal Place');
      expect(poi.rating).toBe(0); // Default rating
      expect(poi.category).toBe('general'); // Default category
      expect(poi.distance).toBe('N/A'); // Default distance
    });

    const req = httpMock.expectOne(req => 
      req.url.startsWith('https://api.foursquare.com/v3/places/search')
    );
    req.flush(mockResponseWithMissingFields);
  });

  it('should include proper headers in requests', () => {
    service.searchNearby(36.8377, -2.4585).subscribe();

    const req = httpMock.expectOne(req => 
      req.url.startsWith('https://api.foursquare.com/v3/places/search')
    );

    // Verificar headers requeridos
    expect(req.request.headers.get('Accept')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBeTruthy();
    
    req.flush({ results: [] });
  });

  it('should cache search results', () => {
    const mockResponse = {
      results: [
        {
          fsq_id: 'cache-test',
          name: 'Cache Test Place',
          location: { formatted_address: 'Cache Address' },
          geocodes: { main: { latitude: 36.8377, longitude: -2.4585 } },
          categories: [{ name: 'Restaurant', id: 'rest-id' }],
          rating: 4.0
        }
      ]
    };

    // Primera llamada - debería hacer petición HTTP
    service.searchNearbyPaginated(36.8377, -2.4585, 1, 12).subscribe();

    // Segunda llamada - debería usar caché (no hacer petición HTTP)
    service.searchNearbyPaginated(36.8377, -2.4585, 2, 12).subscribe();

    // Solo debería haber una petición HTTP para cargar todos los datos
    const req = httpMock.expectOne(req => 
      req.url.startsWith('https://api.foursquare.com/v3/places/search')
    );
    req.flush(mockResponse);

    // No debería haber más peticiones HTTP
    httpMock.expectNone(req => 
      req.url.startsWith('https://api.foursquare.com/v3/places/search')
    );
  });
});