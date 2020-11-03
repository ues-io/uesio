package bots

import (
	"strings"
)

// BotBeforeAPI type
type BotBeforeAPI struct {
	Changes *ChangeRequestsAPI `bot:"changes"`
	errors  []string
}

// BotAfterAPI type
type BotAfterAPI struct {
	Changes *ChangeResponsesAPI `bot:"changes"`
	errors  []string
}

// AddError function
func (b *BotBeforeAPI) AddError(message string) {
	b.errors = append(b.errors, message)
}

// HasErrors function
func (b *BotBeforeAPI) HasErrors() bool {
	return len(b.errors) > 0
}

// GetErrorString function
func (b *BotBeforeAPI) GetErrorString() string {
	return strings.Join(b.errors, ", ")
}

// AddError function
func (b *BotAfterAPI) AddError(message string) {
	b.errors = append(b.errors, message)
}

// HasErrors function
func (b *BotAfterAPI) HasErrors() bool {
	return len(b.errors) > 0
}

// GetErrorString function
func (b *BotAfterAPI) GetErrorString() string {
	return strings.Join(b.errors, ", ")
}
