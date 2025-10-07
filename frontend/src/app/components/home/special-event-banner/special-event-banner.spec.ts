import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialEventBanner } from './special-event-banner';

describe('SpecialEventBanner', () => {
  let component: SpecialEventBanner;
  let fixture: ComponentFixture<SpecialEventBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecialEventBanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpecialEventBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
