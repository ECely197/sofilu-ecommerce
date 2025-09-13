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
  // --- Inyección de Servicios ---
  private fb = inject(FormBuilder);
  private variantTemplateService = inject(VariantTemplateService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  // --- Signals para el Estado ---
  templates = signal<VariantTemplate[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);

  // --- FormGroup para el formulario de creación ---
  templateForm!: FormGroup;

  ngOnInit(): void {
    // Inicializamos el formulario de creación
    this.templateForm = this.fb.group({
      templateName: ['', Validators.required],
      variantName: ['', Validators.required],
      options: this.fb.array([this.newOption('')], Validators.required),
    });

    // Cargamos las plantillas existentes
    this.loadTemplates();
  }

  // --- Métodos para el Formulario ---

  // Getter para acceder fácilmente al FormArray de opciones
  get options(): FormArray {
    return this.templateForm.get('options') as FormArray;
  }

  // Crea un nuevo FormControl para una opción
  newOption(name: string = ''): FormGroup {
    return this.fb.group({
      name: [name, Validators.required],
      priceModifier: [null, [Validators.min(0)]],
      stock: [null, [Validators.min(0)]],
      costPrice: [null, [Validators.min(0)]],
    });
  }

  // Añade una nueva opción al formulario
  addOption(): void {
    this.options.push(this.newOption());
  }

  // Elimina una opción del formulario por su índice
  removeOption(index: number): void {
    if (this.options.length > 1) {
      // Previene eliminar la última opción
      this.options.removeAt(index);
    }
  }

  // --- Métodos de Interacción con la API ---

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

    this.variantTemplateService.createTemplate(formData).subscribe({
      next: (newTemplate) => {
        this.templates.update((current) => [...current, newTemplate]);
        this.toastService.show(
          `Plantilla "${newTemplate.templateName}" creada con éxito.`,
          'success'
        );
        this.templateForm.reset();
        // Reseteamos el FormArray a un solo campo vacío
        this.options.clear();
        this.addOption();
        this.isSaving.set(false);
      },
      error: (err) => {
        this.toastService.show(
          err.error?.details || 'No se pudo crear la plantilla.',
          'error'
        );
        this.isSaving.set(false);
      },
    });
  }

  async deleteTemplate(template: VariantTemplate): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: '¿Confirmar Eliminación?',
      message: `¿Estás seguro de que quieres eliminar la plantilla "${template.templateName}"? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
    });

    if (confirmed) {
      this.variantTemplateService.deleteTemplate(template._id).subscribe({
        next: () => {
          this.templates.update((current) =>
            current.filter((t) => t._id !== template._id)
          );
          this.toastService.show('Plantilla eliminada con éxito.', 'success');
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
