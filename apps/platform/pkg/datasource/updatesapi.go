package datasource

import "github.com/thecloudmasters/uesio/pkg/adapt"

// UpdatesAPI type
type UpdatesAPI struct {
	op *adapt.SaveOp
}

// Get function
func (c *UpdatesAPI) Get() []*ChangeAPI {
	changeAPIs := []*ChangeAPI{}

	_ = c.op.LoopUpdates(func(change *adapt.ChangeItem) error {
		changeAPIs = append(changeAPIs, &ChangeAPI{
			change: change,
		})
		return nil
	})

	return changeAPIs
}
