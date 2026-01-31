package models

import (
	"time"

	"github.com/google/uuid"
)

type UserTransaction struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	FilePath  string    `gorm:"type:text" json:"file_path"` // JSON 檔案路徑
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationship
	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
}
