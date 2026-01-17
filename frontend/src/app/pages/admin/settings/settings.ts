import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  SettingsService,
  AppSettings,
} from '../../../services/settings.service';
import { RippleDirective } from '../../../directives/ripple';
import { ToastService } from '../../../services/toast.service';
// Importamos la directiva para formato numérico si la tienes
// import { NumericFormatDirective } from '../../../directives/numeric-format.directive';

@Component({
  selector: 'app-settings',
  standalone: true,
  // Asegúrate de importar NumericFormatDirective si la usas
  imports: [CommonModule, ReactiveFormsModule, RippleDirective],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class settings implements OnInit {
  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  private toastService = inject(ToastService);

  settingsForm!: FormGroup;
  isLoading = signal(true);
  isSaving = signal(false);
  isEditing = signal(false);

  socialPlatforms = [
    { id: 'instagram', name: 'Instagram', icon: 'camera_alt' },
    { id: 'facebook', name: 'Facebook', icon: 'facebook' },
    { id: 'telegram', name: 'Telegram', icon: 'send' },
    { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp' },
    { id: 'tiktok', name: 'TikTok', icon: 'music_note' },
  ];

  ngOnInit(): void {
    this.settingsForm = this.fb.group({
      storeName: [''],
      contactEmail: ['', Validators.email],
      shippingCostBogota: [0, [Validators.required, Validators.min(0)]],
      shippingCostNational: [0, [Validators.required, Validators.min(0)]],

      // --- ¡CAMPO NUEVO AÑADIDO AL FORMULARIO! ---
      customDeliveryCost: [0, [Validators.required, Validators.min(0)]],

      serviceFeePercentage: [
        0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      socialLinks: this.fb.array([]),
    });

    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading.set(true);
    this.settingsService.getSettings().subscribe((settings) => {
      this.settingsForm.patchValue(settings);
      this.socialLinks.clear();
      settings.socialLinks?.forEach((link) =>
        this.socialLinks.push(this.createSocialLink(link.platform, link.url)),
      );
      this.settingsForm.disable();
      this.isLoading.set(false);
    });
  }

  enableEditing(): void {
    this.isEditing.set(true);
    this.settingsForm.enable();
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.loadSettings(); // Recarga los datos originales
    this.settingsForm.disable();
  }

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
    this.settingsForm.markAsDirty(); // Marcar como modificado
  }

  removeSocialLink(index: number): void {
    this.socialLinks.removeAt(index);
    this.settingsForm.markAsDirty(); // Marcar como modificado
  }

  handleSubmit(): void {
    if (this.settingsForm.invalid) {
      this.toastService.show('Revisa los campos con errores.', 'error');
      return;
    }

    this.isSaving.set(true);
    this.settingsService.updateSettings(this.settingsForm.value).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.settingsForm.disable();
        this.toastService.show('¡Ajustes guardados!', 'success');
        this.settingsForm.markAsPristine();
      },
      error: () => {
        this.isSaving.set(false);
        this.toastService.show('No se pudieron guardar los ajustes.', 'error');
      },
    });
  }
}
