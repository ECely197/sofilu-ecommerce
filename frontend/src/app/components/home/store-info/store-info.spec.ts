import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreInfo } from './store-info';

describe('StoreInfo', () => {
  let component: StoreInfo;
  let fixture: ComponentFixture<StoreInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoreInfo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
