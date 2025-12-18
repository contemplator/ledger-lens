import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import liff from '@line/liff';

@Component({
  selector: 'app-line-binding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './line-binding.html',
  styleUrls: ['./line-binding.css'],
})
export class LineBinding implements OnInit {
  status = signal<'init' | 'binding' | 'success' | 'error'>('init');
  errorMessage = signal<string>('');
  lineProfile = signal<{ name: string; picture?: string } | null>(null);

  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly liffId = (environment as any).liffId || '2008726993-1EwaEvfj';

  async ngOnInit() {
    try {
      await liff.init({ liffId: this.liffId });

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }

      this.status.set('binding');
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error('Failed to get ID Token');
      }

      // Get profile for display
      const profile = await liff.getProfile();
      this.lineProfile.set({
        name: profile.displayName,
        picture: profile.pictureUrl,
      });

      // Bind account
      this.bindAccount(idToken);
    } catch (err: any) {
      console.error('LIFF Error', err);
      this.status.set('error');
      this.errorMessage.set(err.message || 'LIFF Initialization failed');
    }
  }

  bindAccount(idToken: string) {
    this.http.post<any>(`${environment.apiBaseUrl}/line/bind`, { id_token: idToken }).subscribe({
      next: (res) => {
        this.status.set('success');
      },
      error: (err) => {
        console.error('Binding Error', err);
        this.status.set('error');
        this.errorMessage.set(err.error?.error || 'Binding failed');
      },
    });
  }

  closeWindow() {
    liff.closeWindow();
  }
}
