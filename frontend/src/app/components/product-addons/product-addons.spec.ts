import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductAddons } from './product-addons';

describe('ProductAddons', () => {
  let component: ProductAddons;
  let fixture: ComponentFixture<ProductAddons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductAddons]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductAddons);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
