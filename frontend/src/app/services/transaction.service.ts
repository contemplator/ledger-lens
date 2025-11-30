import { Injectable, signal, effect } from '@angular/core';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly STORAGE_KEY = 'ledger_transactions';
  
  // 使用 Signal 管理交易列表狀態
  readonly transactions = signal<Transaction[]>([]);

  constructor() {
    this.loadFromStorage();

    // 當 transactions 改變時，自動同步到 localStorage
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.transactions()));
    });
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

  private loadFromStorage() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.transactions.set(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored transactions', e);
        this.transactions.set([]);
      }
    }
  }
}
