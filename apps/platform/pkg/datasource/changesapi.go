package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// ChangesAPI type
type ChangesAPI struct {
	changes  map[string]reqs.ChangeRequest
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
