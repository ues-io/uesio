package datasource

import "github.com/thecloudmasters/uesio/pkg/adapt"

// UpdatesAPI type
type UpdatesAPI struct {
	op *adapt.SaveOp
}

// Get function
func (c *UpdatesAPI) Get() []*ChangeAPI {
	changeAPIs := []*ChangeAPI{}

	for _, update := range c.op.Updates {
		changeAPIs = append(changeAPIs, &ChangeAPI{
			change: update,
		})
	}
	return changeAPIs
}
