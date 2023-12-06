package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type DeletesAPI struct {
	op *wire.SaveOp
}

func (c *DeletesAPI) Get() []*DeleteAPI {
	deleteAPIs := []*DeleteAPI{}

	_ = c.op.LoopDeletes(func(delete *wire.ChangeItem) error {
		deleteAPIs = append(deleteAPIs, &DeleteAPI{
			delete: delete,
		})
		return nil
	})

	return deleteAPIs
}
