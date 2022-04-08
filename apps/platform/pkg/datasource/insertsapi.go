package datasource

import "github.com/thecloudmasters/uesio/pkg/adapt"

// InsertsAPI type
type InsertsAPI struct {
	op *adapt.SaveOp
}

// Get function
func (c *InsertsAPI) Get() []*ChangeAPI {
	changeAPIs := []*ChangeAPI{}

	for _, insert := range c.op.Inserts {
		changeAPIs = append(changeAPIs, &ChangeAPI{
			change: insert,
		})
	}
	return changeAPIs
}
