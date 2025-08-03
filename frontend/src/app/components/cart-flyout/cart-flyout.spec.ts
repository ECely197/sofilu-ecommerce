import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartFlyout } from './cart-flyout';

describe('CartFlyout', () => {
  let component: CartFlyout;
  let fixture: ComponentFixture<CartFlyout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartFlyout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartFlyout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
