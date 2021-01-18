package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// DeletesAPI type
type DeletesAPI struct {
	deletes map[string]adapters.DeleteRequest
}

// Get function
func (d *DeletesAPI) Get() []string {
	ids := []string{}
	for _, delete := range d.deletes {
		for _, value := range delete {
			ids = append(ids, value.(string))
		}
	}
	return ids
}
