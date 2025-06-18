import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { SearchService } from './search.service'
import { FoursquareService } from './foursquare.service'
import { of } from 'rxjs'

describe('SearchService', () => {
  let service: SearchService
  let foursquareService: jasmine.SpyObj<FoursquareService>

  beforeEach(() => {
    const foursquareSpy = jasmine.createSpyObj('FoursquareService', [
      'searchNearbyPaginated',
      'globalSearchPaginated'
    ])

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SearchService,
        { provide: FoursquareService, useValue: foursquareSpy }
      ]
    })
    
    service = TestBed.inject(SearchService)
    foursquareService = TestBed.inject(FoursquareService) as jasmine.SpyObj<FoursquareService>
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should perform basic search with query', () => {
    const mockResponse = {
      pois: [],
      total: 0,
      page: 1,
      pageSize: 12,
      hasMore: false
    }

    foursquareService.globalSearchPaginated.and.returnValue(of(mockResponse))

    service.getBasicSearchResults('restaurant', 36.8377, -2.4585).subscribe(result => {
      expect(result).toEqual(mockResponse)
    })

    expect(foursquareService.globalSearchPaginated).toHaveBeenCalledWith(
      'restaurant', 36.8377, -2.4585, 1, 12
    )
  })

  it('should perform nearby search without query', () => {
    const mockResponse = {
      pois: [],
      total: 0,
      page: 1,
      pageSize: 12,
      hasMore: false
    }

    foursquareService.searchNearbyPaginated.and.returnValue(of(mockResponse))

    service.getBasicSearchResults('', 36.8377, -2.4585).subscribe(result => {
      expect(result).toEqual(mockResponse)
    })

    expect(foursquareService.searchNearbyPaginated).toHaveBeenCalledWith(
      36.8377, -2.4585, 1, 12
    )
  })

  it('should update search location', () => {
    const location = { lat: 40.4168, lng: -3.7038 }
    service.updateSearchLocation(location)
    expect(service.lastLocation).toEqual(location)
  })

  it('should clear search', () => {
    service.clearSearch()
    expect(service.lastQuery).toBe('')
  })
})