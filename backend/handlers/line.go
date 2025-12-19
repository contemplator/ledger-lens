package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"ledger-lens/backend/database"
	"ledger-lens/backend/models"
	"ledger-lens/backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/line/line-bot-sdk-go/v8/linebot"
	"gorm.io/datatypes"
)

// LineTokenManager handles caching of the short-lived channel access token
type LineTokenManager struct {
	Token     string
	ExpiresAt time.Time
	Mutex     sync.Mutex
}

var tokenManager = &LineTokenManager{}

// GetToken returns a valid channel access token, refreshing if necessary
func (m *LineTokenManager) GetToken() (string, error) {
	m.Mutex.Lock()
	defer m.Mutex.Unlock()

	// Return cached token if valid (buffer 5 minutes)
	if m.Token != "" && time.Now().Add(5*time.Minute).Before(m.ExpiresAt) {
		return m.Token, nil
	}

	// Fetch new token
	channelID := os.Getenv("LINE_MESSAGING_CHANNEL_ID")
	channelSecret := os.Getenv("LINE_CHANNEL_SECRET")

	if channelID == "" || channelSecret == "" {
		return "", fmt.Errorf("LINE_MESSAGING_CHANNEL_ID or LINE_CHANNEL_SECRET not set")
	}

	data := url.Values{}
	data.Set("grant_type", "client_credentials")
	data.Set("client_id", channelID)
	data.Set("client_secret", channelSecret)

	resp, err := http.PostForm("https://api.line.me/v2/oauth/accessToken", data)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("failed to get token: %s", string(body))
	}

	var result struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	m.Token = result.AccessToken
	m.ExpiresAt = time.Now().Add(time.Duration(result.ExpiresIn) * time.Second)

	return m.Token, nil
}

// BindLineAccountRequest structure
type BindLineAccountRequest struct {
	IDToken string `json:"id_token" binding:"required"`
}

// LineVerifyResponse structure for ID Token verification
type LineVerifyResponse struct {
	Iss     string `json:"iss"`
	Sub     string `json:"sub"`
	Aud     string `json:"aud"`
	Exp     int64  `json:"exp"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
	Email   string `json:"email"`
	Error   string `json:"error"`
	Errors  string `json:"error_description"`
}

// BindLineAccount binds the current user to a Line account using ID Token
func BindLineAccount(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req BindLineAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Verify ID Token with Line API
	// We do this manually because the SDK mostly handles Bot API
	clientID := os.Getenv("LINE_LOGIN_CHANNEL_ID")
	if clientID == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server configuration error: LINE_LOGIN_CHANNEL_ID not set"})
		return
	}

	resp, err := http.PostForm("https://api.line.me/oauth2/v2.1/verify", map[string][]string{
		"id_token":  {req.IDToken},
		"client_id": {clientID},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify ID Token"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid ID Token"})
		return
	}

	var tokenData LineVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse token verification response"})
		return
	}

	// Update User
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.LineUserID = tokenData.Sub
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user line binding"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Line account bound successfully", "line_user_name": tokenData.Name})
}

// LineWebhook handles Line Bot events
func LineWebhook(c *gin.Context) {
	channelSecret := os.Getenv("LINE_CHANNEL_SECRET")

	// Get dynamic token
	channelToken, err := tokenManager.GetToken()
	if err != nil {
		utils.LogRequest("Token Error", []byte(err.Error()))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get Line Access Token"})
		return
	}

	bot, err := linebot.New(channelSecret, channelToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 1. Read Body for Logging
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read request body"})
		return
	}
	// Restore body
	c.Request.Body = io.NopCloser(strings.NewReader(string(bodyBytes)))

	// 2. Log Raw Request
	utils.LogRequest("Line Webhook", bodyBytes)

	events, err := bot.ParseRequest(c.Request)
	if err != nil {
		if err == linebot.ErrInvalidSignature {
			c.Status(http.StatusBadRequest)
		} else {
			c.Status(http.StatusInternalServerError)
		}
		return
	}

	for _, event := range events {
		if event.Type == linebot.EventTypeMessage {
			switch message := event.Message.(type) {
			case *linebot.FileMessage:
				handleFileMessage(bot, event.Source.UserID, message, event.ReplyToken)
			case *linebot.TextMessage:
				// Optional: Handle text commands or help
				if message.Text == "help" || message.Text == "說明" {
					bot.ReplyMessage(event.ReplyToken, linebot.NewTextMessage("請上傳 CSV 檔案以更新帳本。上傳後將會覆蓋現有資料。")).Do()
				}
			}
		}
	}

	c.Status(http.StatusOK)
}

func handleFileMessage(bot *linebot.Client, lineUserID string, message *linebot.FileMessage, replyToken string) {
	// 1. Check if user exists
	var user models.User
	if err := database.DB.First(&user, "line_user_id = ?", lineUserID).Error; err != nil {
		bot.ReplyMessage(replyToken, linebot.NewTextMessage("尚未綁定帳號。請點擊以下連結進行綁定：\nhttps://www.hung.services/ledger-lens/line-bind")).Do()
		return
	}

	// 2. Download file
	content, err := bot.GetMessageContent(message.ID).Do()
	if err != nil {
		bot.ReplyMessage(replyToken, linebot.NewTextMessage("讀取檔案失敗。")).Do()
		return
	}
	defer content.Content.Close()

	// 3. Parse CSV
	transactions, err := parseCSV(content.Content)
	if err != nil {
		bot.ReplyMessage(replyToken, linebot.NewTextMessage("CSV 解析失敗: "+err.Error())).Do()
		return
	}

	// 4. Save (Override)
	transactionsJSON, err := json.Marshal(transactions)
	if err != nil {
		bot.ReplyMessage(replyToken, linebot.NewTextMessage("系統錯誤: JSON Marshal failed")).Do()
		return
	}

	var userTransaction models.UserTransaction
	result := database.DB.Where("user_id = ?", user.ID).First(&userTransaction)
	if result.Error != nil {
		// Create
		userTransaction = models.UserTransaction{
			UserID:       user.ID,
			Transactions: datatypes.JSON(transactionsJSON),
		}
		if err := database.DB.Create(&userTransaction).Error; err != nil {
			bot.ReplyMessage(replyToken, linebot.NewTextMessage("儲存失敗。")).Do()
			return
		}
	} else {
		// Update
		userTransaction.Transactions = datatypes.JSON(transactionsJSON)
		if err := database.DB.Save(&userTransaction).Error; err != nil {
			bot.ReplyMessage(replyToken, linebot.NewTextMessage("更新失敗。")).Do()
			return
		}
	}

	bot.ReplyMessage(replyToken, linebot.NewTextMessage(fmt.Sprintf("已成功更新 %d 筆交易紀錄。", len(transactions)))).Do()
}

func parseCSV(r io.Reader) ([]map[string]interface{}, error) {
	reader := csv.NewReader(r)
	reader.LazyQuotes = true

	// Read Header
	header, err := reader.Read()
	if err != nil {
		return nil, err
	}

	// Remove BOM if present
	if len(header) > 0 {
		header[0] = strings.TrimPrefix(header[0], "\ufeff")
	}

	var transactions []map[string]interface{}

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}

		if len(record) != len(header) {
			continue // skip invalid lines
		}

		row := make(map[string]interface{})
		for i, h := range header {
			// Map Chinese headers to English keys
			key := mapHeader(h)
			if key != "" {
				if key == "amount" {
					// Handle amount parsing if needed, but keeping as string is safer for now until Unmarshal logic in frontend is checked.
					// The frontend uses Number(row['金額']), so backend can store string or number.
					// JSON usually stores numbers as numbers.
					// Let's try to convert to float64 for JSON number type
					// For simplicity and safety against format issues (commas etc), let's keep as string first or clean it.
					// But `TransactionInput` in `transaction.go` uses `map[string]interface{}`.
					// Let's try to keep it compatible.
					row[key] = record[i]
				} else {
					row[key] = record[i]
				}
			}
		}
		transactions = append(transactions, row)
	}

	return transactions, nil
}

func mapHeader(h string) string {
	switch h {
	case "日期":
		return "date"
	case "類別":
		return "category"
	case "大類別":
		return "mainCategory"
	case "金額":
		return "amount"
	case "貨幣":
		return "currency"
	case "成員":
		return "member"
	case "帳戶":
		return "account"
	case "標籤":
		return "tags"
	case "備註":
		return "note"
	case "收支區分":
		return "type"
	case "上次更新":
		return "lastUpdated"
	case "UUID":
		return "uuid"
	default:
		return ""
	}
}
