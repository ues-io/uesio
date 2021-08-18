package datasource

import "github.com/thecloudmasters/uesio/pkg/adapt"

// UpdatesAPI type
type UpdatesAPI struct {
	updates  *adapt.ChangeItems
	metadata *adapt.CollectionMetadata
}

// Get function
func (c *UpdatesAPI) Get() []*ChangeAPI {
	changeAPIs := []*ChangeAPI{}

	for _, update := range *c.updates {
		changeAPIs = append(changeAPIs, &ChangeAPI{
			change:   update,
			metadata: c.metadata,
		})
	}
	return changeAPIs
}
