package bots

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// ChangeResponsesAPI type
type ChangeResponsesAPI struct {
	changeresponses map[string]reqs.ChangeResult
	metadata        *adapters.CollectionMetadata
}

// Get function
func (c *ChangeResponsesAPI) Get() []*ChangeResponseAPI {
	changeAPIs := []*ChangeResponseAPI{}

	for _, changeresponse := range c.changeresponses {
		changeAPIs = append(changeAPIs, &ChangeResponseAPI{
			changeresponse: changeresponse,
			metadata:       c.metadata,
		})
	}
	return changeAPIs
}
