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

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RippleDirective],
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

  ngOnInit() {
    this.fetchCustomers();
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
