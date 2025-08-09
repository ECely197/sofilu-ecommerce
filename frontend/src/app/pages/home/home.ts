import { Component } from '@angular/core';
import { RippleDirective } from '../../directives/ripple';
import { RouterLink } from '@angular/router';
import { FeaturedProductsComponent } from '../../components/featured-products/featured-products';
import { trigger, transition, query, stagger, style, animate } from '@angular/animations';
import { CategoriesSection } from '../../components/home/categories-section/categories-section';
import { HowToBuy } from '../../components/how-to-buy/how-to-buy';
import { SaleSection } from '../../components/sale-section/sale-section';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RippleDirective, FeaturedProductsComponent, HowToBuy, SaleSection, CategoriesSection], // ¡Añadir!
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

}
