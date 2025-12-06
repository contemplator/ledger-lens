package handlers

import (
	"encoding/json"
	"net/http"

	"ledger-lens/backend/database"
	"ledger-lens/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type TransactionInput struct {
	Transactions []map[string]interface{} `json:"transactions" binding:"required"`
}

// GetTransactions retrieves the user's transactions
func GetTransactions(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var userTransaction models.UserTransaction
	result := database.DB.Where("user_id = ?", userID).First(&userTransaction)

	if result.Error != nil {
		// No transactions found, return empty array
		c.JSON(http.StatusOK, gin.H{"transactions": []interface{}{}})
		return
	}

	// Parse JSONB to return as JSON array
	var transactions []map[string]interface{}
	if err := json.Unmarshal(userTransaction.Transactions, &transactions); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse transactions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"transactions": transactions})
}

// SaveTransactions saves or updates the user's transactions
func SaveTransactions(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var input TransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert to JSON bytes
	transactionsJSON, err := json.Marshal(input.Transactions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal transactions"})
		return
	}

	// Upsert: Update if exists, create if not
	var userTransaction models.UserTransaction
	result := database.DB.Where("user_id = ?", userID).First(&userTransaction)

	if result.Error != nil {
		// Create new record
		userTransaction = models.UserTransaction{
			UserID:       userID,
			Transactions: datatypes.JSON(transactionsJSON),
		}
		if err := database.DB.Create(&userTransaction).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save transactions"})
			return
		}
	} else {
		// Update existing record
		userTransaction.Transactions = datatypes.JSON(transactionsJSON)
		if err := database.DB.Save(&userTransaction).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update transactions"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transactions saved successfully"})
}
