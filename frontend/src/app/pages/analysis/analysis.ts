import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MarkdownModule } from 'ngx-markdown';
import { TransactionService } from '../../services/transaction.service';
import { GeminiService } from '../../services/gemini.service';
import { MonthlySummary } from '../../models/transaction.model';
import dayjs from 'dayjs';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, ToastModule, MarkdownModule],
  providers: [MessageService],
  templateUrl: './analysis.html',
  styleUrl: './analysis.css'
})
export class Analysis {
  private transactionService = inject(TransactionService);
  private messageService = inject(MessageService);
  private geminiService = inject(GeminiService);

  // View State: 'menu' | 'mom' (Month-over-Month)
  currentView = signal<'menu' | 'mom'>('menu');
  isLoading = signal(false);
  analysisResult = signal<string | null>(null);

  // Data State
  transactions = this.transactionService.transactions;
  
  // MoM Analysis Data
  momAnalysis = computed(() => {
    const all = this.transactions();
    const now = dayjs();
    const currentMonthStr = now.format('YYYYMM');
    const lastMonthStr = now.subtract(1, 'month').format('YYYYMM');

    // Filter transactions
    const currentMonthTxns = all.filter(t => t.date.startsWith(currentMonthStr) && t.type === '支');
    const lastMonthTxns = all.filter(t => t.date.startsWith(lastMonthStr) && t.type === '支');

    // Calculate totals
    const currentTotal = currentMonthTxns.reduce((acc, curr) => acc + curr.amount, 0);
    const lastTotal = lastMonthTxns.reduce((acc, curr) => acc + curr.amount, 0);

    // Calculate difference
    const diff = currentTotal - lastTotal;
    const percentChange = lastTotal === 0 ? (currentTotal > 0 ? 100 : 0) : ((diff / lastTotal) * 100);

    return {
      currentMonthLabel: now.format('YYYY年MM月'),
      lastMonthLabel: now.subtract(1, 'month').format('YYYY年MM月'),
      currentTotal,
      lastTotal,
      diff,
      percentChange,
      isIncrease: diff > 0
    };
  });

  private getMonthlySummary(date: dayjs.Dayjs): MonthlySummary {
    const monthStr = date.format('YYYYMM');
    const txns = this.transactions().filter(t => t.date.startsWith(monthStr) && t.type === '支');
    const totalExpense = txns.reduce((acc, curr) => acc + curr.amount, 0);
    
    const categoryBreakdown: Record<string, number> = {};
    txns.forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
    });

    return {
      month: date.format('YYYY-MM'),
      totalExpense,
      categoryBreakdown
    };
  }

  async onMomClick() {
    this.currentView.set('mom');
    
    // Only fetch if not already fetched or if you want to refresh every time. 
    // Let's refresh every time for now or check if result is null.
    this.isLoading.set(true);
    this.analysisResult.set(null);

    const now = dayjs();
    const current = this.getMonthlySummary(now);
    const previous = this.getMonthlySummary(now.subtract(1, 'month'));

    try {
      const result = await this.geminiService.analyzeComparison(current, previous, 'MoM');
      this.analysisResult.set(result);
    } catch (e) {
      console.error(e);
      this.analysisResult.set('分析失敗，請檢查 API Key 設定或稍後再試。');
    } finally {
      this.isLoading.set(false);
    }
  }

  onYoyClick() {
    this.messageService.add({ 
      severity: 'info', 
      summary: '功能開發中', 
      detail: '年同比分析功能尚未實作，敬請期待！' 
    });
  }

  onBackClick() {
    this.currentView.set('menu');
  }
}
