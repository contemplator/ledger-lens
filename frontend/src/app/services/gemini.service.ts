import { Injectable } from '@angular/core';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { environment } from '../../environments/environment';
import { MonthlySummary, Transaction } from '../models/transaction.model';
import dayjs from 'dayjs';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(environment.geminiApiKey);
  }

  private checkApiKey(): boolean {
    return !!environment.geminiApiKey && environment.geminiApiKey !== 'YOUR_API_KEY_HERE';
  }

  async analyzeComparison(
    current: MonthlySummary,
    previous: MonthlySummary,
    periodType: 'MoM' | 'YoY',
  ): Promise<string> {
    if (!this.checkApiKey()) {
      return 'API Key is missing. Please configure your environment.';
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `
      You are a financial analyst. Compare the spending habits between two periods.
      
      Current Period (${current.month}):
      Total Expense: ${current.totalExpense}
      Breakdown: ${JSON.stringify(current.categoryBreakdown)}
  
      Previous Period (${previous.month}) [${periodType}]:
      Total Expense: ${previous.totalExpense}
      Breakdown: ${JSON.stringify(previous.categoryBreakdown)}
  
      Please provide:
      1. A brief summary of the change in total spending.
      2. Identify top 3 categories where spending increased significantly.
      3. Identify top 3 categories where spending decreased or improved.
      4. A constructive suggestion for the user.
      
      Keep the tone professional yet encouraging. Output in Markdown.
      Reply in Traditional Chinese (繁體中文).
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return '分析時發生錯誤，請檢查 API Key 或網路連線。';
    }
  }

  async semanticSearchFilter(query: string, transactions: Transaction[] = []): Promise<any> {
    if (!this.checkApiKey()) return {};

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            keyword: { type: SchemaType.STRING },
            category: { type: SchemaType.STRING },
            minAmount: { type: SchemaType.NUMBER },
            maxAmount: { type: SchemaType.NUMBER },
            startDate: { type: SchemaType.STRING },
            endDate: { type: SchemaType.STRING },
          },
        },
      },
    });

    // Extract context from transactions
    const uniqueCategories = Array.from(new Set(transactions.map((t) => t.category)))
      .slice(0, 50)
      .join(', ');
    let dateContext = '';
    if (transactions.length > 0) {
      // Parse dates from YYYYMMDD format using dayjs
      const dates = transactions.map((t) => dayjs(t.date, 'YYYYMMDD'));
      const sortedDates = dates.sort((a, b) => a.valueOf() - b.valueOf());
      const minDate = sortedDates[0].format('YYYY-MM-DD');
      const maxDate = sortedDates[sortedDates.length - 1].format('YYYY-MM-DD');
      dateContext = `Dataset Date Range: ${minDate} to ${maxDate}`;
    }

    const prompt = `
      Context:
      - Today: ${dayjs().format('YYYY-MM-DD')}
      - ${dateContext}
      - Available Categories in DB: ${uniqueCategories}
      
      User Query: "${query}"
      
      Task: Extract filter criteria to query the transaction database.
      
      Rules:
      1. **keyword**: ONLY extract specific item names, merchant names, or tags (e.g., "Starbucks", "Taxi"). 
         **DO NOT** extract action verbs or generic terms like "Compare", "Analyze", "Spending", "Cost", "Expense", "Table".
         If the user just asks to "compare X and Y", the keyword should likely be empty.
      2. **category**: Try to map user's intent to one of the "Available Categories". For example "Food" -> "飲食".
      3. **Date Logic**:
         - If the user specifies "This year" or "This month", PREFER the year present in the "Dataset Date Range" if it differs from Today's year.
         - If the user asks to compare two months (e.g. "Oct and Nov"), set 'startDate' to the beginning of the earlier month and 'endDate' to the end of the later month to include BOTH periods.
      
      Return JSON ONLY with these optional fields:
      - keyword (string)
      - category (string)
      - minAmount (number)
      - maxAmount (number)
      - startDate (YYYY-MM-DD)
      - endDate (YYYY-MM-DD)
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return text ? JSON.parse(text) : {};
    } catch (error) {
      console.error('AI Search Error:', error);
      return {};
    }
  }

  async analyzeSpendingContext(transactions: Transaction[], query: string): Promise<string> {
    if (!this.checkApiKey()) return '無法連線至 AI 服務';

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Use a larger context window for Gemini 1.5 Flash
    const simplified = transactions
      .slice(0, 1000)
      .map((t) => `${t.date}: ${t.category} - $${t.amount} (${t.note})`)
      .join('\n');
    const totalCount = transactions.length;

    const prompt = `
      User Question: "${query}"
      
      Transaction Data (${Math.min(totalCount, 1000)} of ${totalCount} records):
      ${simplified}
      
      Instructions:
      1. Answer the user's question based strictly on the provided data.
      2. If the user asks for a comparison (e.g. Oct vs Nov), calculate the totals for each period from the data and present the comparison.
      3. Reply in Traditional Chinese (繁體中文).
      4. Use Markdown formatting for tables or lists if helpful.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || '無回應';
    } catch (e) {
      console.error(e);
      return '分析錯誤';
    }
  }
}
