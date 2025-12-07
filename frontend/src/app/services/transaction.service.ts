import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Transaction } from '../models/transaction.model';
import { AuthService } from './auth.service';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

interface TransactionsResponse {
  transactions: Transaction[];
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly apiUrl = `${environment.apiBaseUrl}/transactions`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  // 使用 Signal 管理交易列表狀態
  readonly transactions = signal<Transaction[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isLoaded = signal<boolean>(false);

  constructor() {
    // 如果已登入，自動載入交易資料
    if (this.authService.isAuthenticated()) {
      this.loadTransactions().subscribe();
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // 從後端載入交易資料
  loadTransactions(): Observable<TransactionsResponse> {
    this.isLoading.set(true);
    return this.http.get<TransactionsResponse>(this.apiUrl, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(response => {
        this.transactions.set(response.transactions || []);
        this.isLoading.set(false);
        this.isLoaded.set(true);
      }),
      catchError(error => {
        console.error('Failed to load transactions', error);
        this.isLoading.set(false);
        this.isLoaded.set(true);
        return of({ transactions: [] });
      })
    );
  }

  // 儲存交易資料到後端
  saveTransactions(data: Transaction[]): Observable<any> {
    this.isLoading.set(true);
    return this.http.post(this.apiUrl, { transactions: data }, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => {
        this.transactions.set(data);
        this.isLoading.set(false);
      }),
      catchError(error => {
        console.error('Failed to save transactions', error);
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  setTransactions(data: Transaction[]) {
    this.transactions.set(data);
  }

  addTransactions(data: Transaction[]) {
    this.transactions.update(current => [...current, ...data]);
  }

  clearTransactions() {
    this.transactions.set([]);
  }
}
