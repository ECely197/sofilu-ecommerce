import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StarRatingComponent),
      multi: true,
    },
  ],
})
export class StarRatingComponent implements ControlValueAccessor {
  @Input() maxRating = 5;
  @Input() rating: number = 0;
  @Input() readonly: boolean = false;

  stars: number[] = [];
  hoveredRating = 0;

  onChange: (rating: number) => void = () => {};
  onTouched: () => void = () => {};

  constructor() {
    this.stars = Array(this.maxRating)
      .fill(0)
      .map((_, i) => i + 1);
  }

  writeValue(rating: number): void {
    this.rating = rating || 0;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // --- Lógica ---

  rate(rating: number): void {
    if (this.readonly) return; // Bloquear si es solo lectura
    this.rating = rating;
    this.onChange(this.rating);
    this.onTouched();
  }

  onStarEnter(rating: number): void {
    if (this.readonly) return; // No hacer hover si es solo lectura
    this.hoveredRating = rating;
  }

  onStarLeave(): void {
    if (this.readonly) return;
    this.hoveredRating = 0;
  }
}
