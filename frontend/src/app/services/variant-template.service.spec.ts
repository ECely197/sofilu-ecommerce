import { TestBed } from '@angular/core/testing';

import { VariantTemplateService } from './variant-template.service';

describe('VariantTemplateService', () => {
  let service: VariantTemplateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VariantTemplateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
