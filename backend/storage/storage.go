package storage

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// GetUploadDir returns the configured upload directory
func GetUploadDir() string {
	dir := os.Getenv("UPLOAD_DIR")
	if dir == "" {
		dir = "./uploads" // 預設值
	}
	return dir
}

// GetTransactionFilePath returns the path for user's transaction file
func GetTransactionFilePath(userID string) string {
	return filepath.Join(GetUploadDir(), "transactions", userID, "transactions.json")
}

// SaveTransactionFile saves transactions to a JSON file
func SaveTransactionFile(userID string, transactions []map[string]interface{}) (string, error) {
	filePath := GetTransactionFilePath(userID)

	// 建立目錄
	if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
		return "", err
	}

	// 寫入 JSON
	data, err := json.MarshalIndent(transactions, "", "  ")
	if err != nil {
		return "", err
	}

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return "", err
	}

	return filePath, nil
}

// ReadTransactionFile reads transactions from a JSON file
func ReadTransactionFile(filePath string) ([]map[string]interface{}, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return []map[string]interface{}{}, nil
		}
		return nil, err
	}

	var transactions []map[string]interface{}
	if err := json.Unmarshal(data, &transactions); err != nil {
		return nil, err
	}

	return transactions, nil
}
