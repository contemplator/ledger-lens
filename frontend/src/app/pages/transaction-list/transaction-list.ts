import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { TransactionTable } from '../../components/transaction-table/transaction-table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TransactionTable,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.css',
})
export class TransactionList {
  private transactionService = inject(TransactionService);

  transactions = this.transactionService.transactions;

  // 搜尋關鍵字
  keyword = signal('');

  // 過濾後的交易列表
  filteredTransactions = computed(() => {
    const currentKeyword = this.keyword().toLowerCase().trim();
    const allTransactions = this.transactions();

    if (!currentKeyword) {
      return allTransactions;
    }

    return allTransactions.filter(
      (t) =>
        t.note.toLowerCase().includes(currentKeyword) ||
        t.category.toLowerCase().includes(currentKeyword) ||
        t.account.toLowerCase().includes(currentKeyword) ||
        t.amount.toString().includes(currentKeyword)
    );
  });
}
