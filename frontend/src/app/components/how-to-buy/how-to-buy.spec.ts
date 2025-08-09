import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HowToBuy } from './how-to-buy';

describe('HowToBuy', () => {
  let component: HowToBuy;
  let fixture: ComponentFixture<HowToBuy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HowToBuy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HowToBuy);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
