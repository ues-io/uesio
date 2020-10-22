package bots

import "strings"

// BotAPI type
type BotAPI struct {
	Changes *ChangesAPI `bot:"changes"`
	errors  []string
}

// AddError function
func (b *BotAPI) AddError(message string) {
	b.errors = append(b.errors, message)
}

// HasErrors function
func (b *BotAPI) HasErrors() bool {
	return len(b.errors) > 0
}

// GetErrorString function
func (b *BotAPI) GetErrorString() string {
	return strings.Join(b.errors, ", ")
}
