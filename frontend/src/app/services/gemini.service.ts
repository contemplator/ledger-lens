import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../environments/environment';
import { MonthlySummary } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(environment.geminiApiKey);
  }

  async analyzeComparison(
    current: MonthlySummary, 
    previous: MonthlySummary, 
    periodType: 'MoM' | 'YoY'
  ): Promise<string> {
    if (!environment.geminiApiKey || environment.geminiApiKey === 'YOUR_API_KEY_HERE') {
      return "API Key is missing. Please configure your environment.";
    }

    const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
      console.error("AI Analysis Error:", error);
      return "分析時發生錯誤，請檢查 API Key 或網路連線。";
    }
  }
}
