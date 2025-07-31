import { Component } from '@angular/core';
import { RippleDirective } from '../../directives/ripple';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RippleDirective], // ¡Añadir!
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

}
