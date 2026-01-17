import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressFormModal } from './address-form-modal';

describe('AddressFormModal', () => {
  let component: AddressFormModal;
  let fixture: ComponentFixture<AddressFormModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddressFormModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddressFormModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
