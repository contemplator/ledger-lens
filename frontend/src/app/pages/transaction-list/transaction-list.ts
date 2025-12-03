import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { TransactionTable } from '../../components/transaction-table/transaction-table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import dayjs from 'dayjs';

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
    ButtonModule,
    SelectButtonModule,
    MultiSelectModule,
    DatePickerModule,
    InputNumberModule,
  ],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.css',
})
export class TransactionList {
  private transactionService = inject(TransactionService);

  transactions = this.transactionService.transactions;

  // 搜尋關鍵字
  keyword = signal('');

  // 進階篩選狀態
  showAdvancedFilters = signal(false);

  // 篩選條件
  typeOptions = [
    { label: '全部', value: 'all' },
    { label: '支出', value: '支' },
    { label: '收入', value: '收' }
  ];
  selectedType = signal('all');
  selectedCategories = signal<string[]>([]);
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);
  minAmount = signal<number | null>(null);
  maxAmount = signal<number | null>(null);

  // 分類選項 (從現有交易中提取，並按類型分組)
  categoryOptions = computed(() => {
    const txns = this.transactions();
    const expenseCategories = new Set<string>();
    const incomeCategories = new Set<string>();

    txns.forEach(t => {
      if (t.type === '支') {
        expenseCategories.add(t.category);
      } else if (t.type === '收') {
        incomeCategories.add(t.category);
      }
    });

    return [
      {
        label: '支出',
        items: Array.from(expenseCategories).map(c => ({ label: c, value: c }))
      },
      {
        label: '收入',
        items: Array.from(incomeCategories).map(c => ({ label: c, value: c }))
      }
    ];
  });

  // 過濾後的交易列表
  filteredTransactions = computed(() => {
    let result = this.transactions();
    const currentKeyword = this.keyword().toLowerCase().trim();

    // 1. 關鍵字搜尋
    if (currentKeyword) {
      result = result.filter(
        (t) =>
          t.note.toLowerCase().includes(currentKeyword) ||
          t.category.toLowerCase().includes(currentKeyword) ||
          t.account.toLowerCase().includes(currentKeyword) ||
          t.amount.toString().includes(currentKeyword)
      );
    }

    // 2. 進階篩選
    
    // 交易類型
    if (this.selectedType() !== 'all') {
      result = result.filter(t => t.type === this.selectedType());
    }

    // 分類
    if (this.selectedCategories().length > 0) {
      result = result.filter(t => this.selectedCategories().includes(t.category));
    }

    // 日期範圍 (交易日期格式為 YYYYMMDD)
    if (this.startDate()) {
      const startStr = dayjs(this.startDate()).format('YYYYMMDD');
      result = result.filter(t => t.date >= startStr);
    }
    if (this.endDate()) {
      const endStr = dayjs(this.endDate()).format('YYYYMMDD');
      result = result.filter(t => t.date <= endStr);
    }

    // 金額範圍
    if (this.minAmount() !== null) {
      result = result.filter(t => t.amount >= this.minAmount()!);
    }
    if (this.maxAmount() !== null) {
      result = result.filter(t => t.amount <= this.maxAmount()!);
    }

    return result;
  });

  toggleAdvancedFilters() {
    this.showAdvancedFilters.update(v => !v);
  }

  clearFilters() {
    this.keyword.set('');
    this.selectedType.set('all');
    this.selectedCategories.set([]);
    this.startDate.set(null);
    this.endDate.set(null);
    this.minAmount.set(null);
    this.maxAmount.set(null);
  }
}
