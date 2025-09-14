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
import {
  VariantTemplateService,
  VariantTemplate,
} from '../../../services/variant-template.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-variant-templates',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './variant-templates.html',
  styleUrl: './variant-templates.scss',
})
export class VariantTemplatesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private variantTemplateService = inject(VariantTemplateService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  templates = signal<VariantTemplate[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  templateForm!: FormGroup;

  ngOnInit(): void {
    this.templateForm = this.fb.group({
      templateName: ['', Validators.required],
      variantName: ['', Validators.required],
      options: this.fb.array([this.newOption('')], Validators.required),
    });
    this.loadTemplates();
  }

  get options(): FormArray {
    return this.templateForm.get('options') as FormArray;
  }

  newOption(name: string = ''): FormGroup {
    return this.fb.group({
      name: [name, Validators.required],
      priceModifier: [null, [Validators.min(0)]],
      stock: [null, [Validators.min(0)]],
      costPrice: [null, [Validators.min(0)]],
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

  handleSubmit(): void {
    if (this.templateForm.invalid) {
      this.toastService.show(
        'Por favor, completa todos los campos requeridos.',
        'error'
      );
      return;
    }
    this.isSaving.set(true);
    const formValue = this.templateForm.getRawValue();

    const payload = {
      templateName: formValue.templateName,
      variantName: formValue.variantName,
      options: formValue.options.map((opt: any) => {
        const cleanOption: any = { name: opt.name };
        const priceModifier = parseFloat(opt.priceModifier);
        const stock = parseInt(opt.stock, 10);
        const costPrice = parseFloat(opt.costPrice);

        if (!isNaN(priceModifier)) cleanOption.priceModifier = priceModifier;
        if (!isNaN(stock)) cleanOption.stock = stock;
        if (!isNaN(costPrice)) cleanOption.costPrice = costPrice;

        return cleanOption;
      }),
    };

    this.variantTemplateService.createTemplate(payload).subscribe({
      next: (newTemplate) => {
        this.templates.update((current) =>
          [...current, newTemplate].sort((a, b) =>
            a.templateName.localeCompare(b.templateName)
          )
        );
        this.toastService.show(
          `Plantilla "${newTemplate.templateName}" creada.`,
          'success'
        );
        this.templateForm.reset();
        this.options.clear();
        this.addOption();
        this.isSaving.set(false);
      },
      error: (err) => {
        const errorDetail =
          err.error?.details || 'No se pudo crear la plantilla.';
        const userMessage = errorDetail.includes('duplicate key')
          ? 'Ya existe una plantilla con ese nombre.'
          : errorDetail;
        this.toastService.show(userMessage, 'error');
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
