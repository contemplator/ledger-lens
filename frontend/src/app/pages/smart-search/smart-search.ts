import { Component, inject, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { TransactionService } from '../../services/transaction.service';
import { GeminiService } from '../../services/gemini.service';
import { Transaction } from '../../models/transaction.model';
import dayjs from 'dayjs';

interface Message {
  role: 'user' | 'ai';
  content: string;
  relatedTransactions?: Transaction[];
}

@Component({
  selector: 'app-smart-search',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownModule],
  templateUrl: './smart-search.html',
  styleUrl: './smart-search.css'
})
export class SmartSearch implements AfterViewChecked {
  private transactionService = inject(TransactionService);
  private geminiService = inject(GeminiService);

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  query = '';
  messages = signal<Message[]>([
    { role: 'ai', content: '您好！我是您的記帳助手。您可以問我像是「上個月花在吃飯多少錢？」或「比較 10 月和 11 月的支出」。' }
  ]);
  isProcessing = signal(false);

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  formatDate(dateStr: string): string {
    return dayjs(dateStr, 'YYYYMMDD').format('YYYY-MM-DD');
  }

  async handleSearch() {
    if (!this.query.trim() || this.isProcessing()) return;

    const userMsg = this.query;
    this.messages.update(msgs => [...msgs, { role: 'user', content: userMsg }]);
    this.query = '';
    this.isProcessing.set(true);

    try {
      const allTransactions = this.transactionService.transactions();
      
      // 1. Extract Filters via AI
      const filters = await this.geminiService.semanticSearchFilter(userMsg, allTransactions);
      console.log("Applied Filters:", filters);

      // 2. Local Filtering
      const results = this.filterTransactions(allTransactions, filters);
      console.log("Found Records:", results.length);

      // 3. Generate Answer
      let aiResponseText = '';
      if (results.length > 0) {
        aiResponseText = await this.geminiService.analyzeSpendingContext(results, userMsg);
      } else {
        aiResponseText = "抱歉，根據目前的篩選條件，我在您的紀錄中找不到符合的交易。請確認您的資料是否包含該日期範圍。";
      }

      this.messages.update(msgs => [...msgs, { 
        role: 'ai', 
        content: aiResponseText,
        relatedTransactions: results.slice(0, 5)
      }]);

    } catch (error) {
      console.error(error);
      this.messages.update(msgs => [...msgs, { role: 'ai', content: "處理您的請求時發生錯誤。" }]);
    } finally {
      this.isProcessing.set(false);
    }
  }

  private filterTransactions(transactions: Transaction[], filters: any): Transaction[] {
    if (!filters || Object.keys(filters).length === 0) return transactions;

    return transactions.filter(t => {
      const tDate = dayjs(t.date, 'YYYYMMDD');
      
      // Date Range
      if (filters.startDate && tDate.isBefore(dayjs(filters.startDate))) return false;
      if (filters.endDate && tDate.isAfter(dayjs(filters.endDate))) return false;

      // Amount Range
      if (filters.minAmount !== undefined && t.amount < filters.minAmount) return false;
      if (filters.maxAmount !== undefined && t.amount > filters.maxAmount) return false;

      // Category (Partial match)
      if (filters.category && !t.category.includes(filters.category)) return false;

      // Keyword (Search in note, category, tags, merchant/member)
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const content = `${t.note} ${t.category} ${t.tags} ${t.member} ${t.account}`.toLowerCase();
        if (!content.includes(keyword)) return false;
      }

      return true;
    });
  }
}
