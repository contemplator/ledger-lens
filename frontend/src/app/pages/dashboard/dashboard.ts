import { Component, computed, inject, signal } from '@angular/core';
import { TransactionService } from '../../services/transaction.service';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule, CardModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  private transactionService = inject(TransactionService);
  
  // 當前年份與月份 (預設為當前時間)
  currentYear = signal(new Date().getFullYear());
  currentMonth = signal(new Date().getMonth() + 1); // 1-12

  // 取得所有交易
  transactions = this.transactionService.transactions;

  // 根據當前年月過濾交易
  filteredTransactions = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const monthStr = month.toString().padStart(2, '0');
    const prefix = `${year}${monthStr}`;

    return this.transactions().filter(t => t.date.startsWith(prefix));
  });

  // 計算本月總支出
  totalExpense = computed(() => {
    return this.filteredTransactions()
      .filter(t => t.type === '支')
      .reduce((acc, curr) => acc + curr.amount, 0);
  });

  // 計算本月總收入
  totalIncome = computed(() => {
    return this.filteredTransactions()
      .filter(t => t.type === '收')
      .reduce((acc, curr) => acc + curr.amount, 0);
  });

  // 計算總交易筆數
  transactionCount = computed(() => this.filteredTransactions().length);

  // 計算結餘
  balance = computed(() => this.totalIncome() - this.totalExpense());

  // 支出分類圖表資料 (Pie Chart)
  categoryChartData = computed(() => {
    const expenses = this.filteredTransactions().filter(t => t.type === '支');
    const categoryMap = new Map<string, number>();

    expenses.forEach(t => {
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + t.amount);
    });

    // 排序並取前 5 名，其他的歸類為 "其他"
    const sortedCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1]);
    
    const topCategories = sortedCategories.slice(0, 5);
    const otherAmount = sortedCategories.slice(5).reduce((acc, curr) => acc + curr[1], 0);
    
    if (otherAmount > 0) {
      topCategories.push(['其他', otherAmount]);
    }

    return {
      labels: topCategories.map(c => c[0]),
      datasets: [
        {
          data: topCategories.map(c => c[1]),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#C9CBCF'
          ],
          hoverBackgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#C9CBCF'
          ]
        }
      ]
    };
  });

  // 近六個月支出趨勢圖表資料 (Line Chart)
  trendChartData = computed(() => {
    // 這裡簡化處理，實際應用可能需要更複雜的日期處理邏輯 (建議引入 date-fns 或 dayjs)
    // 假設日期格式為 "YYYYMMDD"
    const expenses = this.transactions().filter(t => t.type === '支');
    const monthMap = new Map<string, number>();

    expenses.forEach(t => {
      const month = t.date.substring(0, 6); // 取前6碼 YYYYMM
      const current = monthMap.get(month) || 0;
      monthMap.set(month, current + t.amount);
    });

    // 排序月份
    const sortedMonths = Array.from(monthMap.keys()).sort();
    // 取最近 6 個月
    const recentMonths = sortedMonths.slice(-6);

    return {
      labels: recentMonths,
      datasets: [
        {
          label: '每月支出',
          data: recentMonths.map(m => monthMap.get(m)),
          fill: false,
          borderColor: '#42A5F5',
          tension: 0.4
        }
      ]
    };
  });

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };
}
