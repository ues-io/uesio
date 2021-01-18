package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// ChangeAPI type
type ChangeAPI struct {
	change   adapters.ChangeRequest
	metadata *adapters.CollectionMetadata
	errors   []string
}

// Get function
func (c *ChangeAPI) Get(fieldName string) interface{} {
	return c.change.FieldChanges[fieldName]
}

// Set function
func (c *ChangeAPI) Set(fieldName string, value interface{}) {
	c.change.FieldChanges[fieldName] = value
}

// AddError function
func (c *ChangeAPI) AddError(message string) {
	c.errors = append(c.errors, message)
}

// IsNew function
func (c *ChangeAPI) IsNew() bool {
	return c.change.IsNew
}
