import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkWithUs } from './work-with-us';

describe('WorkWithUs', () => {
  let component: WorkWithUs;
  let fixture: ComponentFixture<WorkWithUs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkWithUs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkWithUs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
