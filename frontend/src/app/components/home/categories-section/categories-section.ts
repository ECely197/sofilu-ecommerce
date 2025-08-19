// Contenido completo para: src/app/components/home/categories-section/categories-section.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CategoryService, Category } from '../../../services/category.service';

@Component({
  selector: 'app-categories-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './categories-section.html',
  styleUrl: './categories-section.scss',
})
export class CategoriesSection implements OnInit {
  private categoryService = inject(CategoryService);

  categories = signal<Category[]>([]);

  ngOnInit() {
    this.categoryService.getCategories().subscribe((data) => {
      this.categories.set(data);
    });
  }
}
