package bots

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// ChangeRequestsAPI type
type ChangeRequestsAPI struct {
	changerequests map[string]reqs.ChangeRequest
	metadata       *adapters.CollectionMetadata
}

// Get function
func (c *ChangeRequestsAPI) Get() []*ChangeRequestAPI {
	changeAPIs := []*ChangeRequestAPI{}

	for _, changerequest := range c.changerequests {
		changeAPIs = append(changeAPIs, &ChangeRequestAPI{
			changerequest: changerequest,
			metadata:      c.metadata,
		})
	}
	return changeAPIs
}
