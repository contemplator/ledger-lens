import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
  token: string;
}

interface RegisterResponse {
  message: string;
  user_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api';
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signal to track auth state reactively
  isAuthenticatedSignal = signal<boolean>(this.isAuthenticated());

  constructor() { }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        this.isAuthenticatedSignal.set(true);
        this.router.navigate(['/dashboard']);
      })
    );
  }

  register(email: string, password: string, displayName?: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, {
      email,
      password,
      display_name: displayName
    }).pipe(
      tap(() => {
        // After register, you might want to auto login or redirect to login.
        // For now, let's redirect to login.
        this.router.navigate(['/login']);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    // In a real app, you'd check token expiration here
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
