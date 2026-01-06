import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartBottomSheet } from './cart-bottom-sheet';

describe('CartBottomSheet', () => {
  let component: CartBottomSheet;
  let fixture: ComponentFixture<CartBottomSheet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartBottomSheet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartBottomSheet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
