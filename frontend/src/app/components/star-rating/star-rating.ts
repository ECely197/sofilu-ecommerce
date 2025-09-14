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
  stars: number[] = [];

  rating = 0;
  hoveredRating = 0;

  // --- Métodos requeridos por ControlValueAccessor ---
  onChange: (rating: number) => void = () => {};
  onTouched: () => void = () => {};

  constructor() {
    this.stars = Array(this.maxRating)
      .fill(0)
      .map((_, i) => i + 1);
  }

  // Escribe el valor que viene del FormGroup al componente
  writeValue(rating: number): void {
    this.rating = rating || 0;
  }
  // Registra la función 'onChange' que notificará al FormGroup de los cambios
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  // Registra la función 'onTouched'
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // --- Lógica de Interacción ---
  rate(rating: number): void {
    this.rating = rating;
    this.onChange(this.rating); // Notifica al FormGroup del nuevo valor
    this.onTouched();
  }

  onStarEnter(rating: number): void {
    this.hoveredRating = rating;
  }

  onStarLeave(): void {
    this.hoveredRating = 0; // Resetea el hover al salir
  }
}
