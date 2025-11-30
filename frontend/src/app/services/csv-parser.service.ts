import { Injectable } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import * as Papa from 'papaparse';

@Injectable({
  providedIn: 'root'
})
export class CsvParserService {

  constructor() { }

  parse(file: File): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const transactions: Transaction[] = results.data.map((row: any) => this.mapToTransaction(row));
            resolve(transactions);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  private mapToTransaction(row: any): Transaction {
    // 根據 CSV 欄位名稱映射到 Transaction 介面
    // CSV Header: 日期,類別,大類別,金額,貨幣,成員,帳戶,標籤,備註,收支區分,上次更新,UUID
    return {
      date: row['日期'],
      category: row['類別'],
      mainCategory: row['大類別'],
      amount: Number(row['金額']),
      currency: row['貨幣'],
      member: row['成員'],
      account: row['帳戶'],
      tags: row['標籤'],
      note: row['備註'],
      type: row['收支區分'] as '支' | '收' | '轉',
      lastUpdated: row['上次更新'],
      uuid: row['UUID']
    };
  }
}
