import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  DeliveryOption,
  DeliveryOptionService,
} from '../../../services/delivery-option.service.ts';
import { StorageService } from '../../../services/storage';
import { ToastService } from '../../../services/toast.service';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-delivery-options',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './delivery-options.html',
  styleUrl: './delivery-options.scss',
})
export class DeliveryOptionsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private deliveryOptionService = inject(DeliveryOptionService);
  private storageService = inject(StorageService);
  private toastService = inject(ToastService);

  options = signal<DeliveryOption[]>([]);
  isLoading = signal(true);
  isFormVisible = signal(false);
  isSaving = signal(false);
  isUploading = signal(false);

  editingOptionId = signal<string | null>(null);
  deliveryForm!: FormGroup;
  imagePreview = signal<string | null>(null);

  ngOnInit() {
    this.deliveryForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      cost: [0, [Validators.required, Validators.min(0)]],
      imageUrl: ['', Validators.required],
      isActive: [true],
    });
    this.loadOptions();
  }

  loadOptions() {
    this.isLoading.set(true);
    this.deliveryOptionService.getAllOptions().subscribe((data) => {
      this.options.set(data);
      this.isLoading.set(false);
    });
  }

  openForm(option: DeliveryOption | null = null) {
    if (option) {
      // Editando
      this.editingOptionId.set(option._id);
      this.deliveryForm.patchValue(option);
      this.imagePreview.set(option.imageUrl);
    } else {
      // Creando
      this.editingOptionId.set(null);
      this.deliveryForm.reset({ isActive: true, cost: 0 });
      this.imagePreview.set(null);
    }
    this.isFormVisible.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeForm() {
    this.isFormVisible.set(false);
    document.body.style.overflow = '';
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    this.storageService.uploadImage(file).subscribe({
      next: (url) => {
        this.deliveryForm.patchValue({ imageUrl: url });
        this.imagePreview.set(url);
        this.isUploading.set(false);
      },
      error: () => {
        this.toastService.show('Error al subir la imagen.', 'error');
        this.isUploading.set(false);
      },
    });
  }

  handleSubmit() {
    if (this.deliveryForm.invalid) return;
    this.isSaving.set(true);

    const operation$ = this.editingOptionId()
      ? this.deliveryOptionService.updateOption(
          this.editingOptionId()!,
          this.deliveryForm.value,
        )
      : this.deliveryOptionService.createOption(this.deliveryForm.value);

    operation$.subscribe({
      next: () => {
        this.toastService.show('¡Opción guardada!', 'success');
        this.isSaving.set(false);
        this.closeForm();
        this.loadOptions(); // Recargar la lista
      },
      error: () => {
        this.toastService.show('Error al guardar.', 'error');
        this.isSaving.set(false);
      },
    });
  }

  handleDelete(id: string) {
    if (confirm('¿Estás seguro de eliminar esta opción?')) {
      this.deliveryOptionService.deleteOption(id).subscribe(() => {
        this.toastService.show('Opción eliminada.', 'success');
        this.loadOptions();
      });
    }
  }
}
