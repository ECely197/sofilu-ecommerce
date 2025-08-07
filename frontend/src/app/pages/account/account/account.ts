import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { OrderService } from '../../../services/order';
import { User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { take, filter } from 'rxjs/operators';
import { RippleDirective } from '../../../directives/ripple';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './account.html',
  styleUrl: './account.scss'
})
export class Account {
  // Este componente ahora es solo la "carcasa" con el menú lateral.
  // La lógica para mostrar los pedidos se movió a MyOrdersComponent.
  // ¡Mi instrucción anterior de poner la lógica aquí fue un error!
  // Este componente debe estar simple.
}