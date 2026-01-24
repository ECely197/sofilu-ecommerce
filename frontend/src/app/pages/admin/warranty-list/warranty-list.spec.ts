import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyList } from './warranty-list';

describe('WarrantyList', () => {
  let component: WarrantyList;
  let fixture: ComponentFixture<WarrantyList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarrantyList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarrantyList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
