import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceView } from './invoice-view';

describe('InvoiceView', () => {
  let component: InvoiceView;
  let fixture: ComponentFixture<InvoiceView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoiceView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
