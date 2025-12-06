package routes

import (
	"ledger-lens/backend/handlers"
	"ledger-lens/backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// Public routes
		api.POST("/register", handlers.Register)
		api.POST("/login", handlers.Login)

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/transactions", handlers.GetTransactions)
			protected.POST("/transactions", handlers.SaveTransactions)
		}
	}
}
