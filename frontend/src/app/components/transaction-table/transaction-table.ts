import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-transaction-table',
  standalone: true,
  imports: [CommonModule, TableModule],
  templateUrl: './transaction-table.html',
  styleUrl: './transaction-table.css',
})
export class TransactionTable {
  transactions = input<Transaction[]>([]);
}
