// En: frontend/src/app/pages/admin/variant-templates/variant-templates.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  VariantTemplate,
  VariantTemplateService,
} from '../../../services/variant-template.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { ToastService } from '../../../services/toast.service';
import { RippleDirective } from '../../../directives/ripple';
import { StorageService } from '../../../services/storage';
import { forkJoin, of, switchMap, map, Observable } from 'rxjs';

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
  private storageService = inject(StorageService);

  templates = signal<VariantTemplate[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  editingTemplateId = signal<string | null>(null);

  templateForm!: FormGroup;

  constructor() {
    // Inicializamos el formulario en el constructor
    this.templateForm = this.fb.group({
      templateName: ['', Validators.required],
      variantName: ['', Validators.required],
      options: this.fb.array([this.createOptionGroup()]), // Inicializa con al menos una opción
    });
  }

  ngOnInit() {
    this.loadTemplates();
  }

  get options(): FormArray {
    return this.templateForm.get('options') as FormArray;
  }

  private createOptionGroup(option: any = {}): FormGroup {
    return this.fb.group({
      name: [option.name || '', Validators.required],
      price: [option.price || 0],
      stock: [option.stock || 0],
      costPrice: [option.costPrice || null],
      image: [option.image || null],
      imageFile: [null],
      imagePreview: [option.image || null],
    });
  }

  addOption() {
    this.options.push(this.createOptionGroup());
  }

  removeOption(index: number) {
    if (this.options.length > 1) {
      this.options.removeAt(index);
    }
  }

  //nueva logica
  /**
   * ¡NUEVO! Maneja la selección de un archivo de imagen para una opción específica.
   * @param event El evento del input de tipo 'file'.
   * @param optionIndex El índice de la opción.
   */
  onOptionImageSelected(event: Event, optionIndex: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const option = this.options.at(optionIndex) as FormGroup;

      option.patchValue({ imageFile: file });

      const reader = new FileReader();
      reader.onload = () => {
        option.patchValue({ imagePreview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * ¡NUEVO! Maneja el envío del formulario, ahora con lógica de subida de imágenes.
   */
  handleSubmit() {
    if (this.templateForm.invalid) {
      this.toastService.show(
        'Por favor, completa los campos requeridos.',
        'error'
      );
      return;
    }
    this.isSaving.set(true);

    const uploadOperations$: Observable<any>[] = [];
    this.options.controls.forEach((option, index) => {
      const imageFile = option.get('imageFile')?.value;
      if (imageFile instanceof File) {
        // Si hay un archivo nuevo, crea una operación de subida
        const upload$ = this.storageService.uploadImage(imageFile).pipe(
          map((url) => ({ index, url })) // Pasa el índice y la URL resultante
        );
        uploadOperations$.push(upload$);
      }
    });

    const uploads$ =
      uploadOperations$.length > 0 ? forkJoin(uploadOperations$) : of([]);

    uploads$.subscribe({
      next: (uploadResults) => {
        // Actualiza las URLs en el formulario antes de enviar al backend
        uploadResults.forEach((result) => {
          this.options.at(result.index).get('image')?.setValue(result.url);
        });

        this.saveTemplateData();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toastService.show('Error al subir las imágenes.', 'error');
        console.error(err);
      },
    });
  }

  /**
   * ¡NUEVO! Contiene la lógica final de guardado de datos.
   */
  private saveTemplateData(): void {
    const formValue = this.templateForm.getRawValue();

    // Limpiamos los campos temporales antes de enviar
    const templatePayload = {
      ...formValue,
      options: formValue.options.map((opt: any) => ({
        name: opt.name,
        price: opt.price,
        stock: opt.stock,
        costPrice: opt.costPrice,
        image: opt.image,
      })),
    };

    const operation$ = this.editingTemplateId()
      ? this.variantTemplateService.updateTemplate(
          this.editingTemplateId()!,
          templatePayload
        )
      : this.variantTemplateService.createTemplate(templatePayload);

    operation$.subscribe({
      next: () => {
        this.toastService.show(
          `Plantilla ${
            this.editingTemplateId() ? 'actualizada' : 'creada'
          } con éxito.`,
          'success'
        );
        this.resetForm();
        this.loadTemplates();
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

  /** Prepara el formulario para editar una plantilla existente. */
  startEditing(template: VariantTemplate) {
    this.editingTemplateId.set(template._id);
    this.templateForm.patchValue({
      templateName: template.templateName,
      variantName: template.variantName,
    });
    // Reconstruye el FormArray de opciones con los datos de la plantilla
    this.options.clear();
    template.options.forEach((opt) =>
      this.options.push(this.createOptionGroup(opt))
    );
  }

  private resetForm() {
    this.editingTemplateId.set(null);
    this.templateForm.reset();
    this.options.clear();
    this.addOption(); // Asegura que siempre haya al menos una opción
  }

  //fin de nueva logica

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

  cancelEditing(): void {
    this.editingTemplateId.set(null);
    this.templateForm.reset();
    this.options.clear();
    this.addOption();
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
