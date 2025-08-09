import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleSection } from './sale-section';

describe('SaleSection', () => {
  let component: SaleSection;
  let fixture: ComponentFixture<SaleSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaleSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
