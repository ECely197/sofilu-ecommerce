import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraInfo } from './extra-info';

describe('ExtraInfo', () => {
  let component: ExtraInfo;
  let fixture: ComponentFixture<ExtraInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtraInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtraInfo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
