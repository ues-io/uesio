package bots

import "strings"

// BeforeSaveAPI type
type BeforeSaveAPI struct {
	Changes *ChangesAPI `bot:"changes"`
	errors  []string
}

// AddError function
func (bs *BeforeSaveAPI) AddError(message string) {
	bs.errors = append(bs.errors, message)
}

// HasErrors function
func (bs *BeforeSaveAPI) HasErrors() bool {
	return len(bs.errors) > 0
}

// GetErrorString function
func (bs *BeforeSaveAPI) GetErrorString() string {
	return strings.Join(bs.errors, ", ")
}
