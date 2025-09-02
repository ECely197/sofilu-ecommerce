import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from '../../services/confirmation.service';
import { RippleDirective } from '../../directives/ripple';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, RippleDirective],
  templateUrl: './confirmation-modal.html',
  styleUrl: './confirmation-modal.scss',
  animations: [
    trigger('fadeScale', [
      state('void', style({ opacity: 0, transform: 'scale(0.95)' })),
      transition('void => *', animate('200ms ease-out')),
      transition('* => void', animate('200ms ease-in')),
    ]),
  ],
})
export class ConfirmationModalComponent {
  public confirmationService = inject(ConfirmationService);
}
