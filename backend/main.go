package main

import (
	"log"
	"os"

	"ledger-lens/backend/database"
	"ledger-lens/backend/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Connect to database
	database.Connect()

	// Initialize Gin
	r := gin.Default()

	// Setup routes
	routes.SetupRoutes(r)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "9000"
	}
	r.Run(":" + port)
}
