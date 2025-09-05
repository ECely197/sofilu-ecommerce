import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductExplorerModal } from './product-explorer-modal';

describe('ProductExplorerModal', () => {
  let component: ProductExplorerModal;
  let fixture: ComponentFixture<ProductExplorerModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductExplorerModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductExplorerModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
