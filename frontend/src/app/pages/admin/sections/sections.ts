// En: frontend/src/app/pages/admin/sections/sections.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

// Servicios
import { SectionService, Section } from '../../../services/section.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmationService } from '../../../services/confirmation.service';

// Directivas y Componentes
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-sections',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './sections.html',
  styleUrl: './sections.scss',
})
export class SectionsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sectionService = inject(SectionService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  sections = signal<Section[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  sectionForm!: FormGroup;

  ngOnInit(): void {
    this.sectionForm = this.fb.group({
      name: ['', Validators.required],
    });
    this.loadSections();
  }

  loadSections(): void {
    this.isLoading.set(true);
    this.sectionService.getSections().subscribe({
      next: (data) => {
        this.sections.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.show('Error al cargar las secciones.', 'error');
        this.isLoading.set(false);
      },
    });
  }

  handleSubmit(): void {
    if (this.sectionForm.invalid) {
      this.toastService.show('El nombre de la sección es requerido.', 'error');
      return;
    }
    this.isSaving.set(true);
    this.sectionService.createSection(this.sectionForm.value).subscribe({
      next: (newSection) => {
        this.sections.update((current) =>
          [...current, newSection].sort((a, b) => a.name.localeCompare(b.name))
        );
        this.toastService.show(
          `Sección "${newSection.name}" creada con éxito.`,
          'success'
        );
        this.sectionForm.reset();
        this.isSaving.set(false);
      },
      error: (err) => {
        this.toastService.show(
          err.error?.details || 'No se pudo crear la sección.',
          'error'
        );
        this.isSaving.set(false);
      },
    });
  }

  async deleteSection(section: Section): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: '¿Confirmar Eliminación?',
      message: `¿Estás seguro de que quieres eliminar la sección "${section.name}"? Todas las categorías asociadas deberán ser reasignadas.`,
      confirmText: 'Sí, eliminar',
    });

    if (confirmed) {
      this.sectionService.deleteSection(section._id).subscribe({
        next: () => {
          this.sections.update((current) =>
            current.filter((s) => s._id !== section._id)
          );
          this.toastService.show('Sección eliminada con éxito.', 'success');
        },
        error: () => {
          this.toastService.show('No se pudo eliminar la sección.', 'error');
        },
      });
    }
  }
}
