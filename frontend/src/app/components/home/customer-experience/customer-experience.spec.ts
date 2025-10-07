import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerExperience } from './customer-experience';

describe('CustomerExperience', () => {
  let component: CustomerExperience;
  let fixture: ComponentFixture<CustomerExperience>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerExperience]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerExperience);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
