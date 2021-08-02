package datasource

import "github.com/thecloudmasters/uesio/pkg/adapt"

// InsertsAPI type
type InsertsAPI struct {
	inserts  *adapt.ChangeItems
	metadata *adapt.CollectionMetadata
}

// Get function
func (c *InsertsAPI) Get() []*ChangeAPI {
	changeAPIs := []*ChangeAPI{}

	for _, insert := range *c.inserts {
		changeAPIs = append(changeAPIs, &ChangeAPI{
			change:   insert,
			metadata: c.metadata,
		})
	}
	return changeAPIs
}
