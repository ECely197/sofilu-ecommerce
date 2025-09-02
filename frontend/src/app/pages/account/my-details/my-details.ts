import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserProfile, Customer } from '../../../services/customer';
import { AuthService } from '../../../services/auth';
import { ToastService } from '../../../services/toast.service';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-my-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './my-details.html',
  styleUrl: './my-details.scss',
})
export class MyDetailsComponent implements OnInit {
  private customerService = inject(Customer);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  userProfile = signal<UserProfile | null>(null);
  isEditing = signal(false);
  detailsForm!: FormGroup;

  ngOnInit(): void {
    this.detailsForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: [''],
    });

    this.customerService.getUserProfile().subscribe((profile) => {
      this.userProfile.set(profile);
      this.detailsForm.patchValue(profile);
    });
  }

  startEditing(): void {
    this.detailsForm.patchValue(this.userProfile()!);
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
  }

  handleSubmit(): void {
    if (this.detailsForm.invalid) {
      this.toastService.show(
        'Por favor, completa todos los campos requeridos.',
        'error'
      );
      return;
    }

    this.customerService.updateUserProfile(this.detailsForm.value).subscribe({
      next: (updatedProfile) => {
        this.userProfile.set(updatedProfile);
        this.toastService.show('¡Tus datos han sido actualizados!', 'success');
        this.isEditing.set(false);
      },
      error: (err) => {
        this.toastService.show('No se pudieron actualizar tus datos.', 'error');
      },
    });
  }

  handlePasswordReset(): void {
    if (
      confirm(
        '¿Estás seguro de que quieres cambiar tu contraseña? Se enviará un correo a tu dirección de email.'
      )
    ) {
      this.authService
        .sendPasswordResetEmail()
        .then(() => {
          this.toastService.show(
            'Se ha enviado un correo para restablecer tu contraseña.',
            'success'
          );
        })
        .catch((error) => {
          this.toastService.show(
            'No se pudo enviar el correo de restablecimiento.',
            'error'
          );
        });
    }
  }
}
