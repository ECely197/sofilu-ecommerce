import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  isSidebarVisible = signal(false);

  toggleSidebar(): void {
    this.isSidebarVisible.update((visible) => !visible);
  }

  closeSidebar(): void {
    this.isSidebarVisible.set(false);
  }
}
