import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import {
  SettingsService,
  AppSettings,
} from '../../../services/settings.service';
import { RippleDirective } from '../../../directives/ripple';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  animations: [
    /* ... animación fadeIn ... */
  ],
})
export class settings implements OnInit {
  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  private toastService = inject(ToastService);

  settingsForm!: FormGroup;
  isLoading = signal(true);
  isSaving = signal(false);
  isEditing = signal(false);

  // Lista de redes sociales predefinidas con sus iconos
  socialPlatforms = [
    { id: 'instagram', name: 'Instagram', icon: 'camera_alt' },
    { id: 'facebook', name: 'Facebook', icon: 'facebook' },
    { id: 'telegram', name: 'Telegram', icon: 'send' },
    { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp' },
    { id: 'tiktok', name: 'TikTok', icon: 'music_note' },
  ];

  /** Activa el modo de edición y habilita el formulario. */
  enableEditing(): void {
    this.isEditing.set(true);
    this.settingsForm.enable(); // Habilita todos los campos del formulario
  }

  /** Cancela la edición, revierte los cambios y deshabilita el formulario. */
  cancelEditing(): void {
    this.isEditing.set(false);
    this.loadSettings(); // Recarga los datos originales desde el servicio
    this.settingsForm.disable(); // Deshabilita el formulario
  }

  ngOnInit(): void {
    // Inicializamos el formulario con todos los nuevos campos.
    this.settingsForm = this.fb.group({
      storeName: [''],
      contactEmail: ['', Validators.email],
      shippingCostBogota: [0, [Validators.required, Validators.min(0)]],
      shippingCostNational: [0, [Validators.required, Validators.min(0)]],
      serviceFeePercentage: [
        0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      socialLinks: this.fb.array([]), // FormArray para las redes sociales
    });

    this.loadSettings();
  }

  // --- Getters para el FormArray ---
  get socialLinks(): FormArray {
    return this.settingsForm.get('socialLinks') as FormArray;
  }

  createSocialLink(platform = 'instagram', url = ''): FormGroup {
    return this.fb.group({
      platform: [platform, Validators.required],
      url: [url, Validators.required],
    });
  }

  addSocialLink(): void {
    this.socialLinks.push(this.createSocialLink());
  }

  removeSocialLink(index: number): void {
    this.socialLinks.removeAt(index);
  }

  loadSettings(): void {
    this.isLoading.set(true);
    this.settingsService.getSettings().subscribe((settings) => {
      this.settingsForm.patchValue(settings);

      this.socialLinks.clear(); // Limpiamos antes de rellenar
      settings.socialLinks.forEach((link) =>
        this.socialLinks.push(this.createSocialLink(link.platform, link.url))
      );

      this.settingsForm.disable(); // ¡NUEVO! El formulario empieza deshabilitado
      this.isLoading.set(false);
    });
  }

  handleSubmit(): void {
    if (this.settingsForm.invalid) {
      this.toastService.show(
        'Por favor, revisa los campos con errores.',
        'error'
      );
      return;
    }

    this.isSaving.set(true);
    this.settingsService.updateSettings(this.settingsForm.value).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.settingsForm.disable();
        this.toastService.show('¡Ajustes guardados con éxito!', 'success');
        this.settingsForm.markAsPristine();
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Error al guardar los ajustes:', err);
        this.toastService.show('No se pudieron guardar los ajustes.', 'error');
      },
    });
  }
}
