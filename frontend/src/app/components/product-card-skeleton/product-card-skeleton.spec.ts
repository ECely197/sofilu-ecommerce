import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCardSkeleton } from './product-card-skeleton';

describe('ProductCardSkeleton', () => {
  let component: ProductCardSkeleton;
  let fixture: ComponentFixture<ProductCardSkeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardSkeleton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductCardSkeleton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
