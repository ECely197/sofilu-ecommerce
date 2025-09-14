import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WishlistFlyout } from './wishlist-flyout';

describe('WishlistFlyout', () => {
  let component: WishlistFlyout;
  let fixture: ComponentFixture<WishlistFlyout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WishlistFlyout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WishlistFlyout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
