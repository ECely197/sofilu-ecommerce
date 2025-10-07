import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-create-gift-cta',
  standalone: true,
  imports: [RouterLink, RippleDirective],
  templateUrl: './create-gift-cta.html',
  styleUrls: ['./create-gift-cta.scss'],
})
export class CreateGiftCta {}
