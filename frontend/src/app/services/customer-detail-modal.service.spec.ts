import { TestBed } from '@angular/core/testing';

import { CustomerDetailModalService } from './customer-detail-modal.service';

describe('CustomerDetailModalService', () => {
  let service: CustomerDetailModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerDetailModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
