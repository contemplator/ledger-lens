package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Email        string    `gorm:"unique;not null"`
	PasswordHash string    `gorm:"not null"`
	DisplayName  string
	LineUserID   string    `gorm:"uniqueIndex"` // Line User ID for binding
	IsActive     bool      `gorm:"default:true"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`
}
