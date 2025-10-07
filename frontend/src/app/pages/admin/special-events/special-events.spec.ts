import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialEvents } from './special-events';

describe('SpecialEvents', () => {
  let component: SpecialEvents;
  let fixture: ComponentFixture<SpecialEvents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecialEvents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpecialEvents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
