package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

type DeletesAPI struct {
	op *adapt.SaveOp
}

func (d *DeletesAPI) Get() []string {
	ids := []string{}

	for _, delete := range d.op.Deletes {

		idValue, err := delete.FieldChanges.GetField(adapt.ID_FIELD)
		if err != nil {
			continue
		}
		ids = append(ids, idValue.(string))
	}

	return ids
}
