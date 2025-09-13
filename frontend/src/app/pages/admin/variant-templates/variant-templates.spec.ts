import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VariantTemplates } from './variant-templates';

describe('VariantTemplates', () => {
  let component: VariantTemplates;
  let fixture: ComponentFixture<VariantTemplates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariantTemplates]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VariantTemplates);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
