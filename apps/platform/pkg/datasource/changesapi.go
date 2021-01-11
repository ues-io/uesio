package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// ChangesAPI type
type ChangesAPI struct {
	changes  map[string]adapters.ChangeRequest
	metadata *adapters.CollectionMetadata
}

// Get function
func (c *ChangesAPI) Get() []*ChangeAPI {
	changeAPIs := []*ChangeAPI{}

	for _, change := range c.changes {
		changeAPIs = append(changeAPIs, &ChangeAPI{
			change:   change,
			metadata: c.metadata,
		})
	}
	return changeAPIs
}
