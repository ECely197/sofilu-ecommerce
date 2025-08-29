import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
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
  styleUrl: './account.scss',
})
export class Account {
  public authService = inject(AuthService);
}
