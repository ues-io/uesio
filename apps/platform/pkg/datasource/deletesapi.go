package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// DeletesAPI type
type DeletesAPI struct {
	deletes  adapt.ChangeItems
	metadata *adapt.CollectionMetadata
}

// Get function
func (d *DeletesAPI) Get() []string {
	ids := []string{}

	for _, delete := range d.deletes {

		idField, err := d.metadata.GetIDField()
		if err != nil {
			continue
		}

		idValue, err := delete.FieldChanges.GetField(idField.GetFullName())
		if err != nil {
			continue
		}
		ids = append(ids, idValue.(string))
	}

	return ids
}
