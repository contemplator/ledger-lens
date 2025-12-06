import { Component, inject, signal } from '@angular/core';
import { CsvParserService } from '../../services/csv-parser.service';
import { TransactionService } from '../../services/transaction.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-file-dropzone',
  standalone: true,
  imports: [],
  templateUrl: './file-dropzone.html',
  styleUrl: './file-dropzone.css',
})
export class FileDropzone {
  private csvParser = inject(CsvParserService);
  private transactionService = inject(TransactionService);
  private router = inject(Router);

  isDragging = signal(false);
  isProcessing = signal(false);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  async handleFile(file: File) {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('請上傳 CSV 檔案');
      return;
    }

    this.isProcessing.set(true);
    try {
      const transactions = await this.csvParser.parse(file);
      
      // 儲存到後端
      this.transactionService.saveTransactions(transactions).subscribe({
        next: () => {
          // 上傳成功後重新載入頁面或導向 Dashboard
          window.location.reload();
        },
        error: (error) => {
          console.error('儲存失敗', error);
          alert('儲存失敗，請稍後再試');
          this.isProcessing.set(false);
        }
      });
    } catch (error) {
      console.error('CSV 解析失敗', error);
      alert('檔案解析失敗，請確認格式是否正確');
      this.isProcessing.set(false);
    }
  }
}
