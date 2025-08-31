// Contenido completo para: src/app/pages/admin/category-list/category-list.component.ts

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

import { CategoryService, Category } from '../../../services/category.service';
import { RippleDirective } from '../../../directives/ripple';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RippleDirective],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
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
export class CategoryList implements OnInit {
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);

  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.fetchCategories();
  }

  fetchCategories(): void {
    this.isLoading.set(true);
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener las categorías:', err);
        this.isLoading.set(false);
      },
    });
  }

  deleteCategory(categoryId: string): void {
    if (
      confirm(
        '¿Estás seguro de que quieres eliminar esta categoría? Esto no se puede deshacer.'
      )
    ) {
      this.categoryService.deleteCategory(categoryId).subscribe({
        next: () => {
          this.categories.update((currentCategories) =>
            currentCategories.filter((c) => c._id !== categoryId)
          );
        },
        error: (err) => {
          console.error('Error al eliminar la categoría:', err);
          this.toastService.show('No se pudo eliminar la categoría.');
        },
      });
    }
  }
}
