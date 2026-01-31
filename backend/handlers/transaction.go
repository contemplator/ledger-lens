package handlers

import (
	"net/http"

	"ledger-lens/backend/database"
	"ledger-lens/backend/models"
	"ledger-lens/backend/storage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TransactionInput struct {
	Transactions []map[string]interface{} `json:"transactions" binding:"required"`
}

// GetTransactions retrieves the user's transactions from JSON file
func GetTransactions(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var userTransaction models.UserTransaction
	result := database.DB.Where("user_id = ?", userID).First(&userTransaction)

	if result.Error != nil {
		// No transactions found, return empty array
		c.JSON(http.StatusOK, gin.H{"transactions": []interface{}{}})
		return
	}

	// 從檔案讀取
	if userTransaction.FilePath == "" {
		c.JSON(http.StatusOK, gin.H{"transactions": []interface{}{}})
		return
	}

	transactions, err := storage.ReadTransactionFile(userTransaction.FilePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read transactions file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"transactions": transactions})
}

// SaveTransactions saves the user's transactions to JSON file
func SaveTransactions(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var input TransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 儲存到檔案
	filePath, err := storage.SaveTransactionFile(userID.String(), input.Transactions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save transactions file"})
		return
	}

	// Upsert: Update if exists, create if not
	var userTransaction models.UserTransaction
	result := database.DB.Where("user_id = ?", userID).First(&userTransaction)

	if result.Error != nil {
		// Create new record
		userTransaction = models.UserTransaction{
			UserID:   userID,
			FilePath: filePath,
		}
		if err := database.DB.Create(&userTransaction).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save transaction record"})
			return
		}
	} else {
		// Update existing record
		userTransaction.FilePath = filePath
		if err := database.DB.Save(&userTransaction).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update transaction record"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transactions saved successfully"})
}
