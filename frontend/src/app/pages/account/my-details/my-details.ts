import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-my-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-details.html',
  styleUrl: './my-details.scss'
})
export class MyDetailsComponent {
  // Usaremos el observable directamente en el template con el async pipe
  public currentUser$ = inject(AuthService).currentUser$;
}