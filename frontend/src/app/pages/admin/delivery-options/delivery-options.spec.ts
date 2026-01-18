import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryOptions } from './delivery-options';

describe('DeliveryOptions', () => {
  let component: DeliveryOptions;
  let fixture: ComponentFixture<DeliveryOptions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryOptions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryOptions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
