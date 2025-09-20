// En: frontend/src/app/pages/admin/variant-templates/variant-templates.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

// Servicios
import {
  VariantTemplateService,
  VariantTemplate,
} from '../../../services/variant-template.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmationService } from '../../../services/confirmation.service';

// Directivas y Componentes
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-variant-templates',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './variant-templates.html',
  styleUrl: './variant-templates.scss',
})
export class VariantTemplatesComponent implements OnInit {
  // --- Inyecciones y Signals ---
  private fb = inject(FormBuilder);
  private variantTemplateService = inject(VariantTemplateService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  templates = signal<VariantTemplate[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);

  // ¡NUEVO! Signal para rastrear el ID de la plantilla que se está editando
  editingTemplateId = signal<string | null>(null);

  templateForm!: FormGroup;

  ngOnInit(): void {
    this.templateForm = this.fb.group({
      templateName: ['', Validators.required],
      variantName: ['', Validators.required],
      options: this.fb.array([this.newOption()], Validators.required),
    });
    this.loadTemplates();
  }

  get options(): FormArray {
    return this.templateForm.get('options') as FormArray;
  }

  newOption(
    name: string = '',
    price: number | null = null,
    stock: number | null = null,
    costPrice: number | null = null
  ): FormGroup {
    return this.fb.group({
      name: [name, Validators.required],
      price: [price, [Validators.min(0)]],
      stock: [stock, [Validators.min(0)]],
      costPrice: [costPrice, [Validators.min(0)]],
    });
  }

  addOption(): void {
    this.options.push(this.newOption());
  }

  removeOption(index: number): void {
    if (this.options.length > 1) {
      this.options.removeAt(index);
    }
  }

  loadTemplates(): void {
    this.isLoading.set(true);
    this.variantTemplateService.getTemplates().subscribe({
      next: (data) => {
        this.templates.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.show('Error al cargar las plantillas.', 'error');
        this.isLoading.set(false);
      },
    });
  }

  // --- ¡NUEVO! Método para empezar a editar ---
  startEditing(template: VariantTemplate): void {
    this.editingTemplateId.set(template._id);
    this.templateForm.patchValue({
      templateName: template.templateName,
      variantName: template.variantName,
    });

    this.options.clear();
    template.options.forEach((opt) => {
      this.options.push(
        this.newOption(opt.name, opt.price, opt.stock, opt.costPrice)
      );
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEditing(): void {
    this.editingTemplateId.set(null);
    this.templateForm.reset();
    this.options.clear();
    this.addOption();
  }

  handleSubmit(): void {
    if (this.templateForm.invalid) {
      this.toastService.show(
        'Por favor, completa todos los campos requeridos.',
        'error'
      );
      return;
    }
    this.isSaving.set(true);
    const formData = this.templateForm.getRawValue();

    // Decidimos si crear o actualizar basándonos en si estamos en modo edición
    const operation$ = this.editingTemplateId()
      ? this.variantTemplateService.updateTemplate(
          this.editingTemplateId()!,
          formData
        )
      : this.variantTemplateService.createTemplate(formData);

    operation$.subscribe({
      next: (savedTemplate) => {
        if (this.editingTemplateId()) {
          // Si actualizamos, reemplazamos el item en el array
          this.templates.update((current) =>
            current.map((t) =>
              t._id === savedTemplate._id ? savedTemplate : t
            )
          );
        } else {
          // Si creamos, lo añadimos al final
          this.templates.update((current) => [...current, savedTemplate]);
        }
        this.toastService.show(
          `Plantilla "${savedTemplate.templateName}" guardada con éxito.`,
          'success'
        );
        this.cancelEditing(); // Resetea el formulario y el estado de edición
      },
      error: (err) => {
        this.toastService.show(
          err.error?.details || 'No se pudo guardar la plantilla.',
          'error'
        );
      },
      complete: () => {
        this.isSaving.set(false);
      },
    });
  }

  async deleteTemplate(template: VariantTemplate): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: '¿Confirmar Eliminación?',
      message: `¿Estás seguro de que quieres eliminar la plantilla "${template.templateName}"?`,
      confirmText: 'Sí, eliminar',
    });

    if (confirmed) {
      this.variantTemplateService.deleteTemplate(template._id).subscribe({
        next: () => {
          this.templates.update((current) =>
            current.filter((t) => t._id !== template._id)
          );
          this.toastService.show('Plantilla eliminada.', 'success');
        },
        error: () => {
          this.toastService.show('No se pudo eliminar la plantilla.', 'error');
        },
      });
    }
  }

  getOptionNames(options: { name: string }[]): string {
    if (!options || options.length === 0) {
      return 'Sin opciones';
    }
    return options.map((o) => o.name).join(', ');
  }
}
