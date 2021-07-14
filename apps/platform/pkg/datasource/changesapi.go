package datasource

import "github.com/thecloudmasters/uesio/pkg/adapt"

// ChangesAPI type
type ChangesAPI struct {
	changes  *adapt.ChangeItems
	metadata *adapt.CollectionMetadata
}

// Get function
func (c *ChangesAPI) Get() []*ChangeAPI {
	changeAPIs := []*ChangeAPI{}

	for _, change := range *c.changes {
		changeAPIs = append(changeAPIs, &ChangeAPI{
			change:   change,
			metadata: c.metadata,
		})
	}
	return changeAPIs
}
