import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  WarrantyService,
  WarrantyType,
} from '../../../services/warranty.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-warranties',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './warranty-list.html',
  styleUrl: './warranty-list.scss',
})
export class WarrantyListComponent implements OnInit {
  private warrantyService = inject(WarrantyService);
  private toast = inject(ToastService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);

  // Signals
  warranties = signal<WarrantyType[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);

  // Estado del Formulario
  showForm = signal(false);
  isEditing = signal(false);
  editingId = signal<string | null>(null);

  warrantyForm: FormGroup;

  constructor() {
    this.warrantyForm = this.fb.group({
      name: ['', Validators.required],
      durationMonths: [1, [Validators.required, Validators.min(0)]],
      description: [''],
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.warrantyService.getWarranties().subscribe({
      next: (data) => {
        this.warranties.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  // --- ACCIONES DEL FORMULARIO ---

  openCreate() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.warrantyForm.reset({ durationMonths: 1 });
    this.showForm.set(true);
    // Scroll al formulario en móvil
    setTimeout(() => {
      const formEl = document.getElementById('warrantyForm');
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  openEdit(warranty: WarrantyType) {
    this.isEditing.set(true);
    this.editingId.set(warranty._id);
    this.warrantyForm.patchValue(warranty);
    this.showForm.set(true);
    setTimeout(() => {
      const formEl = document.getElementById('warrantyForm');
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  closeForm() {
    this.showForm.set(false);
    this.warrantyForm.reset();
  }

  submit() {
    if (this.warrantyForm.invalid) {
      this.toast.show('Completa los campos requeridos', 'error');
      return;
    }

    this.isSaving.set(true);
    const operation$ = this.isEditing()
      ? this.warrantyService.updateWarranty(
          this.editingId()!,
          this.warrantyForm.value,
        )
      : this.warrantyService.createWarranty(this.warrantyForm.value);

    operation$.subscribe({
      next: () => {
        this.toast.show(
          `Garantía ${this.isEditing() ? 'actualizada' : 'creada'}`,
          'success',
        );
        this.loadData();
        this.closeForm();
        this.isSaving.set(false);
      },
      error: (err) => {
        this.toast.show(err.error?.message || 'Error al guardar', 'error');
        this.isSaving.set(false);
      },
    });
  }

  async delete(id: string) {
    const confirmed = await this.confirmationService.confirm({
      title: '¿Eliminar Garantía?',
      message:
        'Esta acción no se puede deshacer. Los productos con esta garantía podrían quedar sin ella.',
      confirmText: 'Sí, eliminar',
    });

    if (confirmed) {
      this.warrantyService.deleteWarranty(id).subscribe({
        next: () => {
          this.toast.show('Eliminado correctamente', 'success');
          this.loadData(); // Recargar lista
        },
        error: () => this.toast.show('No se pudo eliminar', 'error'),
      });
    }
  }
}
