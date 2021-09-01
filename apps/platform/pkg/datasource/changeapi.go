package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// ChangeAPI type
type ChangeAPI struct {
	change   adapt.ChangeItem
	metadata *adapt.CollectionMetadata
	errors   []string
}

// Get function
func (c *ChangeAPI) Get(fieldName string) interface{} {
	val, err := c.change.FieldChanges.GetField(fieldName)
	if err != nil {
		return c.GetOld(fieldName)
	}
	return val
}

// GetOld function
func (c *ChangeAPI) GetOld(fieldName string) interface{} {
	val, err := c.change.OldValues.GetField(fieldName)
	if err != nil {
		return nil
	}
	return val
}

// Set function
func (c *ChangeAPI) Set(fieldName string, value interface{}) {
	_ = c.change.FieldChanges.SetField(fieldName, value)
}

// AddError function
func (c *ChangeAPI) AddError(message string) {
	c.errors = append(c.errors, message)
}
