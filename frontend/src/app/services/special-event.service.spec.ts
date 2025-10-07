import { TestBed } from '@angular/core/testing';

import { SpecialEventService } from './special-event.service';

describe('SpecialEventService', () => {
  let service: SpecialEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpecialEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
