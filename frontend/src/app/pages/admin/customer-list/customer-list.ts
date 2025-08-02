import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Customer } from '../../../services/customer';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-list.html',
  styleUrl: '../product-list/product-list.scss'
})
export class CustomerList implements OnInit {
  private customerService = inject(Customer);
  public customers: any[] = [];

  ngOnInit() {
    this.customerService.getCustomers().subscribe(data => {
      this.customers = data;
    });
  }
}
