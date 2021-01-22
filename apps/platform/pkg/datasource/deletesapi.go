package datasource

import "github.com/thecloudmasters/uesio/pkg/adapt"

// DeletesAPI type
type DeletesAPI struct {
	deletes map[string]adapt.DeleteRequest
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
