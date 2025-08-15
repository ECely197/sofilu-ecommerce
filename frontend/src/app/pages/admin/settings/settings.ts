import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

import { SettingsService } from '../../../services/settings.service';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
          '400ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
})
export class settings implements OnInit {
  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);

  settingsForm!: FormGroup;
  isLoading = signal(true);
  isSaving = signal(false);

  ngOnInit(): void {
    // Inicializamos el formulario
    this.settingsForm = this.fb.group({
      shippingCost: [null, [Validators.required, Validators.min(0)]],
    });

    // Obtenemos el costo de envío actual y rellenamos el formulario
    this.settingsService.getShippingCost().subscribe((cost) => {
      this.settingsForm.patchValue({ shippingCost: cost });
      this.isLoading.set(false);
    });
  }

  handleSubmit(): void {
    if (this.settingsForm.invalid) return;

    this.isSaving.set(true);
    const newCost = this.settingsForm.value.shippingCost;

    this.settingsService.updateShippingCost(newCost).subscribe({
      next: () => {
        this.isSaving.set(false);
        alert('¡Ajustes guardados con éxito!');
        // Mantenemos el formulario "sucio" como "limpio" para deshabilitar el botón
        this.settingsForm.markAsPristine();
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Error al guardar los ajustes:', err);
        alert('No se pudieron guardar los ajustes.');
      },
    });
  }
}
