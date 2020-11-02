package bots

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// ChangeRequestAPI type
type ChangeRequestAPI struct {
	changerequest reqs.ChangeRequest
	metadata      *adapters.CollectionMetadata
	errors        []string
}

// Get function
func (c *ChangeRequestAPI) Get(fieldName string) interface{} {
	return c.changerequest[fieldName]
}

// Set function
func (c *ChangeRequestAPI) Set(fieldName string, value interface{}) {
	c.changerequest[fieldName] = value
}

// AddError function
func (c *ChangeRequestAPI) AddError(message string) {
	c.errors = append(c.errors, message)
}
