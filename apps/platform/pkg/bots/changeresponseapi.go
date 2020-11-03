package bots

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// ChangeResponseAPI type
type ChangeResponseAPI struct {
	changeresponse reqs.ChangeResult
	metadata       *adapters.CollectionMetadata
	errors         []string
}

// Get function
func (c *ChangeResponseAPI) Get(fieldName string) interface{} {
	return c.changeresponse.Data[fieldName]
}

// AddError function
func (c *ChangeResponseAPI) AddError(message string) {
	c.errors = append(c.errors, message)
}
