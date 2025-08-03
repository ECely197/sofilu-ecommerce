import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// ¡Importamos las herramientas para el formulario!
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  // ¡Añadimos ReactiveFormsModule!
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  // ¡Reutilizamos los estilos del formulario de productos para consistencia!
  styleUrl: '../product-form/product-form.scss'
})
export class settings implements OnInit {

  // Creamos un FormGroup principal que contendrá otros grupos anidados.
  settingsForm = new FormGroup({
    // Grupo para la información de la tienda
    storeInfo: new FormGroup({
      name: new FormControl('Sofilu'),
      email: new FormControl('contacto@sofilu.com')
    }),
    // Grupo para los ajustes de envío
    shipping: new FormGroup({
      enableFreeShipping: new FormControl(true),
      freeShippingThreshold: new FormControl(200000) // 200.000 COP
    })
  });

  ngOnInit(): void {
    // En un futuro, aquí cargaríamos los ajustes que ya están guardados en la base de datos
    // y los pondríamos en el formulario con this.settingsForm.patchValue(...).
  }

  handleSubmit(): void {
    if (this.settingsForm.valid) {
      // Por ahora, solo mostraremos los datos en la consola.
      // En el futuro, llamaríamos a un 'SettingsService' para guardarlos en el backend.
      console.log('Ajustes guardados:', this.settingsForm.value);
      alert('¡Ajustes guardados con éxito!');
    }
  }
}