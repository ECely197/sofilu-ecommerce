import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyCoupons } from './my-coupons';

describe('MyCoupons', () => {
  let component: MyCoupons;
  let fixture: ComponentFixture<MyCoupons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyCoupons]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyCoupons);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
