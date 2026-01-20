import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { VendorService, Vendor } from '../../../services/vendor.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-vendors',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './vendors.html',
  styleUrl: './vendors.scss',
})
export class VendorsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private vendorService = inject(VendorService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  vendors = signal<Vendor[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  vendorForm!: FormGroup;

  ngOnInit(): void {
    this.vendorForm = this.fb.group({
      name: ['', Validators.required],
    });
    this.loadVendors();
  }

  loadVendors(): void {
    this.isLoading.set(true);
    this.vendorService.getVendors().subscribe({
      next: (data) => {
        this.vendors.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.show('Error al cargar vendedores.', 'error');
        this.isLoading.set(false);
      },
    });
  }

  handleSubmit(): void {
    if (this.vendorForm.invalid) {
      this.toastService.show('El nombre es requerido.', 'error');
      return;
    }
    this.isSaving.set(true);
    this.vendorService.createVendor(this.vendorForm.value).subscribe({
      next: (newVendor) => {
        this.vendors.update((current) =>
          [...current, newVendor].sort((a, b) => a.name.localeCompare(b.name)),
        );
        this.toastService.show(
          `Vendedor "${newVendor.name}" creado.`,
          'success',
        );
        this.vendorForm.reset();
        this.isSaving.set(false);
      },
      error: (err) => {
        this.toastService.show(
          err.error?.message || 'Error al crear.',
          'error',
        );
        this.isSaving.set(false);
      },
    });
  }

  async deleteVendor(vendor: Vendor): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: '¿Eliminar Vendedor?',
      message: `¿Seguro que quieres eliminar a "${vendor.name}"?`,
      confirmText: 'Sí, eliminar',
    });

    if (confirmed) {
      this.vendorService.deleteVendor(vendor._id).subscribe({
        next: () => {
          this.vendors.update((current) =>
            current.filter((v) => v._id !== vendor._id),
          );
          this.toastService.show('Vendedor eliminado.', 'success');
        },
        error: () => {
          this.toastService.show(
            'No se pudo eliminar (puede tener productos asociados).',
            'error',
          );
        },
      });
    }
  }
}
