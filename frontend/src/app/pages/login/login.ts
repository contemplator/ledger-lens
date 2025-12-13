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
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = '';
  password = '';
  isLoading = false;

  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  onLogin() {
    if (!this.email || !this.password) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill in all fields' });
      return;
    }

    this.isLoading = true;
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        // Navigation handled in AuthService
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Login error', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error.error || 'Login failed' });
      },
    });
  }
}
