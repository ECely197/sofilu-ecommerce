import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  SpecialEvent,
  SpecialEventService,
} from '../../../services/special-event.service';
import { ProductServices } from '../../../services/product';
import { Product } from '../../../interfaces/product.interface';
import { StorageService } from '../../../services/storage';
import { ToastService } from '../../../services/toast.service';
import { RippleDirective } from '../../../directives/ripple';
import { ConfirmationService } from '../../../services/confirmation.service';

@Component({
  selector: 'app-special-events',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './special-events.html',
  styleUrls: ['./special-events.scss'],
})
export class SpecialEvents implements OnInit {
  // --- Inyecciones ---
  private fb = inject(FormBuilder);
  private specialEventService = inject(SpecialEventService);
  private productService = inject(ProductServices);
  private storageService = inject(StorageService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  // --- Estado ---
  events = signal<SpecialEvent[]>([]);
  allProducts = signal<Product[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  editingEventId = signal<string | null>(null);

  eventForm!: FormGroup;
  imagePreview = signal<string | null>(null);
  private selectedFile: File | null = null;

  ngOnInit(): void {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      subtitle: [''],
      imageUrl: ['', Validators.required],
      linkedProducts: [[]],
    });

    this.productService
      .getProducts()
      .subscribe((prods) => this.allProducts.set(prods));
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.specialEventService.getEvents().subscribe((data) => {
      this.events.set(data);
      this.isLoading.set(false);
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.imagePreview.set(URL.createObjectURL(this.selectedFile));
    }
  }

  handleSubmit(): void {
    if (this.eventForm.invalid) {
      this.toastService.show(
        'Por favor, completa todos los campos requeridos.',
        'error'
      );
      return;
    }
    this.isSaving.set(true);

    if (this.selectedFile) {
      this.storageService
        .uploadImage(this.selectedFile)
        .subscribe((imageUrl) => {
          this.eventForm.patchValue({ imageUrl: imageUrl });
          this.saveEventData();
        });
    } else {
      this.saveEventData();
    }
  }

  private saveEventData(): void {
    const operation$ = this.editingEventId()
      ? this.specialEventService.updateEvent(
          this.editingEventId()!,
          this.eventForm.value
        )
      : this.specialEventService.createEvent(this.eventForm.value);

    operation$.subscribe({
      next: () => {
        this.toastService.show(
          `Evento ${
            this.editingEventId() ? 'actualizado' : 'creado'
          } con éxito.`,
          'success'
        );
        this.resetForm();
        this.loadEvents();
      },
      error: (err) =>
        this.toastService.show('No se pudo guardar el evento.', 'error'),
      complete: () => this.isSaving.set(false),
    });
  }

  startEditing(event: SpecialEvent): void {
    this.editingEventId.set(event._id);
    this.imagePreview.set(event.imageUrl);
    this.eventForm.patchValue({
      title: event.title,
      subtitle: event.subtitle,
      imageUrl: event.imageUrl,
      linkedProducts: event.linkedProducts.map((p) => p._id),
    });
  }

  resetForm(): void {
    this.editingEventId.set(null);
    this.selectedFile = null;
    this.imagePreview.set(null);
    this.eventForm.reset({ linkedProducts: [] });
  }

  /**
   * Elimina un evento especial después de pedir confirmación al usuario.
   * @param event El objeto de evento completo que se va a eliminar.
   */
  async deleteEvent(eventId: string): Promise<void> {
    const eventToDelete = this.events().find((e) => e._id === eventId);
    if (!eventToDelete) return;

    const confirmed = await this.confirmationService.confirm({
      title: '¿Confirmar Eliminación?',
      message: `¿Estás seguro de que quieres eliminar el evento "${eventToDelete.title}"?`,
      confirmText: 'Sí, eliminar',
    });

    if (confirmed) {
      this.specialEventService.deleteEvent(eventId).subscribe({
        next: () => {
          this.events.update((current) =>
            current.filter((e) => e._id !== eventId)
          );
          this.toastService.show('Evento eliminado con éxito.', 'success');
        },
        error: () => {
          this.toastService.show('No se pudo eliminar el evento.', 'error');
        },
      });
    }
  }

  setActive(id: string): void {
    this.specialEventService.setActive(id).subscribe((updatedEvents) => {
      this.events.set(updatedEvents);
      this.toastService.show('Banner principal actualizado.', 'success');
    });
  }
}
