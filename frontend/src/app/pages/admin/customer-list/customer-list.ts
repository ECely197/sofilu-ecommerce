import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';

import { Customer } from '../../../services/customer';
import { RippleDirective } from '../../../directives/ripple';

import { FormControl, ReactiveFormsModule } from '@angular/forms'; // ¡Importante!
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  startWith,
} from 'rxjs/operators';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RippleDirective, ReactiveFormsModule],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss', // Apuntamos a su propio archivo SCSS
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger('80ms', [
              animate(
                '400ms cubic-bezier(0.35, 0, 0.25, 1)',
                style({ opacity: 1, transform: 'none' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class CustomerList implements OnInit {
  private customerService = inject(Customer);

  customers = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  searchControl = new FormControl('');

  ngOnInit() {
    // La magia de la búsqueda reactiva
    this.searchControl.valueChanges
      .pipe(
        // Empieza inmediatamente con un valor vacío
        startWith(''),
        // Espera 300ms después de que el usuario deja de teclear
        debounceTime(300),
        // Solo emite si el valor ha cambiado
        distinctUntilChanged(),
        // Muestra el loader
        switchMap((searchTerm) => {
          this.isLoading.set(true);
          // Llama al servicio de búsqueda. Si el término es nulo o vacío, lo maneja.
          return this.customerService.searchCustomers({
            search: searchTerm || '',
          });
        })
      )
      .subscribe({
        next: (data) => {
          this.customers.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error al buscar clientes:', err);
          this.isLoading.set(false);
        },
      });
  }

  fetchCustomers(): void {
    this.isLoading.set(true);
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener los clientes:', err);
        this.isLoading.set(false);
      },
    });
  }
}
