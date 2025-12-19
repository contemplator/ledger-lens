package utils

import (
	"fmt"
	"os"
	"time"
)

// LogRequest dumps content to a log file
func LogRequest(prefix string, content []byte) {
	logStats := os.Getenv("LOG_FILE_PATH")
	if logStats == "" {
		logStats = "app.log"
	}

	f, err := os.OpenFile(logStats, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("Error opening log file:", err)
		return
	}
	defer f.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	entry := fmt.Sprintf("[%s] %s:\n%s\n\n------------------------------------------------\n\n", timestamp, prefix, string(content))

	if _, err := f.WriteString(entry); err != nil {
		fmt.Println("Error writing to log file:", err)
	}
}
