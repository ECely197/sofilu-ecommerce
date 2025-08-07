import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyDetails } from './my-details';

describe('MyDetails', () => {
  let component: MyDetails;
  let fixture: ComponentFixture<MyDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
