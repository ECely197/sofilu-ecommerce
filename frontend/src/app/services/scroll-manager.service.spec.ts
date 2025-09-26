import { TestBed } from '@angular/core/testing';

import { ScrollManagerService } from './scroll-manager.service';

describe('ScrollManagerService', () => {
  let service: ScrollManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScrollManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
