package handlers

import (
	"strings"
	"testing"
)

func TestParseCSV(t *testing.T) {
	// Sample CSV content with Chinese headers
	csvContent := `日期,類別,大類別,金額,貨幣,成員,帳戶,標籤,備註,收支區分,上次更新,UUID
2023-12-01,Food,Expenses,100,TWD,Me,Cash,Lunch,Delicious,支,2023-12-01T12:00:00Z,uuid-123
2023-12-02,Salary,Income,50000,TWD,Me,Bank,,Salary,收,2023-12-02T10:00:00Z,uuid-456`

	reader := strings.NewReader(csvContent)
	transactions, err := parseCSV(reader)

	if err != nil {
		t.Fatalf("Failed to parse CSV: %v", err)
	}

	if len(transactions) != 2 {
		t.Errorf("Expected 2 transactions, got %d", len(transactions))
	}

	// Check first transaction
	t1 := transactions[0]
	if t1["date"] != "2023-12-01" {
		t.Errorf("Expected date 2023-12-01, got %v", t1["date"])
	}
	if t1["amount"] != 100.0 {
		t.Errorf("Expected amount 100, got %v", t1["amount"])
	}
	if t1["type"] != "支" {
		t.Errorf("Expected type 支, got %v", t1["type"])
	}

	// Check second transaction
	t2 := transactions[1]
	if t2["mainCategory"] != "Income" {
		t.Errorf("Expected mainCategory Income, got %v", t2["mainCategory"])
	}
}
