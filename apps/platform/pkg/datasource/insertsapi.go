package datasource

import "github.com/thecloudmasters/uesio/pkg/adapt"

type InsertsAPI struct {
	op *adapt.SaveOp
}

func (c *InsertsAPI) Get() []*ChangeAPI {
	changeAPIs := []*ChangeAPI{}

	_ = c.op.LoopInserts(func(change *adapt.ChangeItem) error {
		changeAPIs = append(changeAPIs, &ChangeAPI{
			change: change,
		})
		return nil
	})

	return changeAPIs
}
