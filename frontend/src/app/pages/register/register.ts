import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  email = '';
  password = '';
  displayName = '';
  isLoading = false;

  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  onRegister() {
    if (!this.email || !this.password) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Email and Password are required' });
      return;
    }

    this.isLoading = true;
    this.authService.register(this.email, this.password, this.displayName).subscribe({
      next: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Registration successful! Redirecting to login...' });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Register error', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error.error || 'Registration failed' });
      }
    });
  }
}
