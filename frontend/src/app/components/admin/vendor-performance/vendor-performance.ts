import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendorService, VendorStats } from '../../../services/vendor.service';

@Component({
  selector: 'app-vendor-performance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vendor-performance.html',
  styleUrl: './vendor-performance.scss',
})
export class VendorPerformanceComponent implements OnInit {
  private vendorService = inject(VendorService);

  stats = signal<VendorStats[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.vendorService.getVendorStats().subscribe((data) => {
      this.stats.set(data);
      this.isLoading.set(false);
    });
  }
}
