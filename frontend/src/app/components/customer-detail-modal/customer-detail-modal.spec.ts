import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerDetailModal } from './customer-detail-modal';

describe('CustomerDetailModal', () => {
  let component: CustomerDetailModal;
  let fixture: ComponentFixture<CustomerDetailModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerDetailModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerDetailModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
