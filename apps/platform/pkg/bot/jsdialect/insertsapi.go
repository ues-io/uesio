package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type InsertsAPI struct {
	op *wire.SaveOp
}

func (c *InsertsAPI) Get() []*ChangeAPI {
	var changeAPIs []*ChangeAPI

	_ = c.op.LoopInserts(func(change *wire.ChangeItem) error {
		changeAPIs = append(changeAPIs, &ChangeAPI{
			change: change,
			op:     c.op,
		})
		return nil
	})

	return changeAPIs
}
