import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGiftCta } from './create-gift-cta';

describe('CreateGiftCta', () => {
  let component: CreateGiftCta;
  let fixture: ComponentFixture<CreateGiftCta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGiftCta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateGiftCta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
