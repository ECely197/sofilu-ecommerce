import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  // ¡Reutilizamos una vez más los estilos de formulario!
  styleUrl: '../product-form/product-form.scss'
})
export class settings implements OnInit {

  settingsForm = new FormGroup({
    // Grupo para la info de la tienda
    storeInfo: new FormGroup({
      name: new FormControl('Sofilu'),
      email: new FormControl('contacto@sofilu.com')
    }),
    // Grupo para los envíos
    shipping: new FormGroup({
      enableFreeShipping: new FormControl(true),
      freeShippingThreshold: new FormControl(200000) // 200.000 COP
    })
  });

  ngOnInit(): void {
    // En un futuro, aquí cargaríamos los ajustes guardados desde el backend
  }

  handleSubmit(): void {
    if (this.settingsForm.valid) {
      console.log('Ajustes guardados:', this.settingsForm.value);
      alert('¡Ajustes guardados con éxito!');
    }
  }
}