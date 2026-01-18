import { TestBed } from '@angular/core/testing';

import { DeliveryOptionServiceTs } from './delivery-option.service.ts';

describe('DeliveryOptionServiceTs', () => {
  let service: DeliveryOptionServiceTs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeliveryOptionServiceTs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
