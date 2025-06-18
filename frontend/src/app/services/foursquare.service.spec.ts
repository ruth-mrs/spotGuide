import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { FoursquareService } from './foursquare.service'

describe('FoursquareService', () => {
  let service: FoursquareService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FoursquareService]
    })
    service = TestBed.inject(FoursquareService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should search nearby places', () => {
    const mockResponse = {
      results: [
        {
          fsq_id: 'test-id',
          name: 'Test Place',
          location: { formatted_address: 'Test Address' },
          categories: [{ name: 'Restaurant' }],
          rating: 4.5
        }
      ]
    }

    service.searchNearby(36.8377, -2.4585).subscribe(pois => {
      expect(pois.length).toBe(1)
      expect(pois[0].name).toBe('Test Place')
    })

    const req = httpMock.expectOne(req => req.url.includes('/places/nearby'))
    expect(req.request.method).toBe('GET')
    req.flush(mockResponse)
  })

  it('should search by text', () => {
    const mockResponse = {
      results: [
        {
          fsq_id: 'test-id',
          name: 'Test Restaurant',
          location: { formatted_address: 'Test Address' },
          categories: [{ name: 'Restaurant' }],
          rating: 4.0
        }
      ]
    }

    service.searchByText('restaurant', 36.8377, -2.4585).subscribe(pois => {
      expect(pois.length).toBe(1)
      expect(pois[0].name).toBe('Test Restaurant')
    })

    const req = httpMock.expectOne(req => req.url.includes('/places/search'))
    expect(req.request.method).toBe('GET')
    req.flush(mockResponse)
  })

  it('should handle search errors', () => {
    service.searchNearby(36.8377, -2.4585).subscribe(
      pois => expect(pois).toEqual([]),
      error => fail('Should not have error')
    )

    const req = httpMock.expectOne(req => req.url.includes('/places/nearby'))
    req.flush('Error', { status: 500, statusText: 'Server Error' })
  })
})