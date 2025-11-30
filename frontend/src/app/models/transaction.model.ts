export interface Transaction {
  date: string;          // 日期 (e.g., "20251128")
  category: string;      // 類別 (e.g., "飲食")
  mainCategory: string;  // 大類別
  amount: number;        // 金額
  currency: string;      // 貨幣 (e.g., "TWD")
  member: string;        // 成員
  account: string;       // 帳戶 (e.g., "現金")
  tags: string;          // 標籤
  note: string;          // 備註
  type: '支' | '收' | '轉'; // 收支區分
  lastUpdated: string;   // 上次更新
  uuid: string;          // UUID
}

export interface MonthlySummary {
  month: string;
  totalExpense: number;
  categoryBreakdown: Record<string, number>;
}
