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
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-warranty-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './warranty-list.html',
  styleUrl: './warranty-list.scss',
})
export class WarrantyListComponent implements OnInit {
  private warrantyService = inject(WarrantyService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  warranties = signal<WarrantyType[]>([]);
  showForm = signal(false);
  isEditing = signal(false);
  editingId = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    durationMonths: [1, [Validators.required, Validators.min(0)]],
    description: [''],
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.warrantyService
      .getWarranties()
      .subscribe((data) => this.warranties.set(data));
  }

  openCreate() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.form.reset({ durationMonths: 1 });
    this.showForm.set(true);
  }

  openEdit(warranty: WarrantyType) {
    this.isEditing.set(true);
    this.editingId.set(warranty._id);
    this.form.patchValue(warranty);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
  }

  submit() {
    if (this.form.invalid) return;

    const obs$ = this.isEditing()
      ? this.warrantyService.updateWarranty(this.editingId()!, this.form.value)
      : this.warrantyService.createWarranty(this.form.value);

    obs$.subscribe({
      next: () => {
        this.toast.show(this.isEditing() ? 'Actualizado' : 'Creado', 'success');
        this.loadData();
        this.closeForm();
      },
      error: () => this.toast.show('Error al guardar', 'error'),
    });
  }

  delete(id: string) {
    if (!confirm('¿Eliminar esta garantía?')) return;
    this.warrantyService.deleteWarranty(id).subscribe(() => {
      this.toast.show('Eliminado', 'success');
      this.loadData();
    });
  }
}
