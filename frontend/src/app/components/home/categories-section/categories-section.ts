import {
  Component,
  Input,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Category } from '../../../services/category.service';
import { ScrollManagerService } from '../../../services/scroll-manager.service';

@Component({
  selector: 'app-categories-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories-section.html',
  styleUrl: './categories-section.scss',
})
export class CategoriesSection {
  @Input() categories: Category[] = [];
  private router = inject(Router);
  private scrollManager = inject(ScrollManagerService);

  handleCategoryClick(event: MouseEvent, category: Category): void {
    event.preventDefault();

    if (this.router.url === '/') {
      this.scrollManager.requestScrollToCategory(category.slug);
    } else {
      this.router.navigate(['/']).then(() => {
        setTimeout(
          () => this.scrollManager.requestScrollToCategory(category.slug),
          100
        );
      });
    }
  }
}