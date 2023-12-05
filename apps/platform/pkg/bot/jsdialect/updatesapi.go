package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type UpdatesAPI struct {
	op *wire.SaveOp
}

func (c *UpdatesAPI) Get() []*ChangeAPI {
	changeAPIs := []*ChangeAPI{}

	_ = c.op.LoopUpdates(func(change *wire.ChangeItem) error {
		changeAPIs = append(changeAPIs, &ChangeAPI{
			change: change,
		})
		return nil
	})

	return changeAPIs
}
