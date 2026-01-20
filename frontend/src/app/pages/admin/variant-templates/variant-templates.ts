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
  VariantTemplate,
  VariantTemplateService,
} from '../../../services/variant-template.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { ToastService } from '../../../services/toast.service';
import { RippleDirective } from '../../../directives/ripple';
import { StorageService } from '../../../services/storage';
import { forkJoin, of, map, Observable } from 'rxjs';

@Component({
  selector: 'app-variant-templates',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './variant-templates.html',
  styleUrl: './variant-templates.scss',
})
export class VariantTemplatesComponent implements OnInit {
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
    this.templateForm = this.fb.group({
      templateName: ['', Validators.required],
      variantName: ['', Validators.required],
      options: this.fb.array([this.createOptionGroup()]),
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
      costPrice: [option.costPrice || 0],
      image: [option.image || null],
      imageFile: [null],
      imagePreview: [option.image || null],
    });
  }

  addOption() {
    this.options.push(this.createOptionGroup());
  }
  removeOption(index: number) {
    if (this.options.length > 1) this.options.removeAt(index);
  }

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

  handleSubmit() {
    if (this.templateForm.invalid) {
      this.toastService.show('Completa los campos.', 'error');
      return;
    }
    this.isSaving.set(true);

    const uploadOperations$: Observable<any>[] = [];
    this.options.controls.forEach((option, index) => {
      const imageFile = option.get('imageFile')?.value;
      if (imageFile instanceof File) {
        uploadOperations$.push(
          this.storageService
            .uploadImage(imageFile)
            .pipe(map((url) => ({ index, url }))),
        );
      }
    });

    const uploads$ =
      uploadOperations$.length > 0 ? forkJoin(uploadOperations$) : of([]);

    uploads$.subscribe({
      next: (uploadResults) => {
        uploadResults.forEach((result) => {
          this.options.at(result.index).get('image')?.setValue(result.url);
        });
        this.saveTemplateData();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toastService.show('Error subiendo imágenes.', 'error');
      },
    });
  }

  private saveTemplateData(): void {
    const formValue = this.templateForm.getRawValue();
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
          templatePayload,
        )
      : this.variantTemplateService.createTemplate(templatePayload);

    operation$.subscribe({
      next: () => {
        this.toastService.show(
          `Plantilla ${this.editingTemplateId() ? 'actualizada' : 'creada'}.`,
          'success',
        );
        this.resetForm();
        this.loadTemplates();
      },
      error: () => this.toastService.show('Error al guardar.', 'error'),
      complete: () => this.isSaving.set(false),
    });
  }

  startEditing(template: VariantTemplate) {
    this.editingTemplateId.set(template._id);
    this.templateForm.patchValue({
      templateName: template.templateName,
      variantName: template.variantName,
    });
    this.options.clear();
    template.options.forEach((opt) =>
      this.options.push(this.createOptionGroup(opt)),
    );
  }

  cancelEditing() {
    this.resetForm();
  }
  private resetForm() {
    this.editingTemplateId.set(null);
    this.templateForm.reset();
    this.options.clear();
    this.addOption();
  }

  loadTemplates(): void {
    this.isLoading.set(true);
    this.variantTemplateService.getTemplates().subscribe({
      next: (data) => {
        this.templates.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.show('Error cargando plantillas.', 'error');
        this.isLoading.set(false);
      },
    });
  }

  async deleteTemplate(template: VariantTemplate) {
    if (
      await this.confirmationService.confirm({
        title: '¿Eliminar Plantilla?',
        message: 'Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
      })
    ) {
      this.variantTemplateService.deleteTemplate(template._id).subscribe({
        next: () => {
          this.templates.update((current) =>
            current.filter((t) => t._id !== template._id),
          );
          this.toastService.show('Plantilla eliminada.', 'success');
        },
        error: () => this.toastService.show('Error al eliminar.', 'error'),
      });
    }
  }

  getOptionNames(options: { name: string }[]): string {
    return options && options.length > 0
      ? options.map((o) => o.name).join(', ')
      : 'Sin opciones';
  }
}
