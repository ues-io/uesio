package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

type DeletesAPI struct {
	op *adapt.SaveOp
}

func (c *DeletesAPI) Get() []*DeleteAPI {
	deleteAPIs := []*DeleteAPI{}

	_ = c.op.LoopDeletes(func(delete *adapt.ChangeItem) error {
		deleteAPIs = append(deleteAPIs, &DeleteAPI{
			delete: delete,
		})
		return nil
	})

	return deleteAPIs
}
