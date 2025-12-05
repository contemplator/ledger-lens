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
import { RadioButtonModule } from 'primeng/radiobutton';
import { CardModule } from 'primeng/card';
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
    RadioButtonModule,
    CardModule,
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
  datePreset = signal<string>('');

  // 日期預設選項
  datePresets = [
    { label: '本月', value: 'thisMonth' },
    { label: '上個月', value: 'lastMonth' },
    { label: '近兩個月', value: 'recent2Months' },
    { label: '今年', value: 'thisYear' },
  ];

  applyDatePreset(preset: string) {
    this.datePreset.set(preset);
    const now = dayjs();
    let start: dayjs.Dayjs;
    let end: dayjs.Dayjs;

    switch (preset) {
      case 'thisMonth':
        start = now.startOf('month');
        end = now.endOf('month');
        break;
      case 'lastMonth':
        start = now.subtract(1, 'month').startOf('month');
        end = now.subtract(1, 'month').endOf('month');
        break;
      case 'recent2Months':
        start = now.subtract(1, 'month').startOf('month');
        end = now.endOf('month');
        break;
      case 'thisYear':
        start = now.startOf('year');
        end = now.endOf('year');
        break;
      default:
        return;
    }

    this.startDate.set(start.toDate());
    this.endDate.set(end.toDate());
  }

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
    const start = this.startDate();
    const end = this.endDate();
    if (start || end) {
      result = result.filter((t) => {
        const date = dayjs(t.date);
        if (start && date.isBefore(dayjs(start), 'day')) return false;
        if (end && date.isAfter(dayjs(end), 'day')) return false;
        return true;
      });
    }

    // 金額範圍
    const min = this.minAmount();
    const max = this.maxAmount();
    if (min !== null) {
      result = result.filter((t) => t.amount >= min);
    }
    if (max !== null) {
      result = result.filter((t) => t.amount <= max);
    }

    return result;
  });

  // 統計數據
  totalIncome = computed(() => {
    return this.filteredTransactions()
      .filter(t => t.type === '收')
      .reduce((sum, t) => sum + t.amount, 0);
  });

  totalExpense = computed(() => {
    return this.filteredTransactions()
      .filter(t => t.type === '支')
      .reduce((sum, t) => sum + t.amount, 0);
  });

  totalBalance = computed(() => {
    return this.totalIncome() - this.totalExpense();
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
