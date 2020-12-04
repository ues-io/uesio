package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// RouteCollection slice
type RouteCollection []Route

// GetName function
func (rc *RouteCollection) GetName() string {
	return "routes"
}

// GetFields function
func (rc *RouteCollection) GetFields() []string {
	return []string{"id", "name", "path", "workspaceid", "view", "theme"}
}

// NewItem function
func (rc *RouteCollection) NewItem(key string) (BundleableItem, error) {
	return NewRoute(key)
}

// GetKeyPrefix function
func (rc *RouteCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (rc *RouteCollection) AddItem(item CollectionableItem) {
	*rc = append(*rc, *item.(*Route))
}

// UnMarshal function
func (rc *RouteCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(rc, data)
}

// Marshal function
func (rc *RouteCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(rc)
}

// GetItem function
func (rc *RouteCollection) GetItem(index int) CollectionableItem {
	actual := *rc
	return &actual[index]
}

// Loop function
func (rc *RouteCollection) Loop(iter func(item CollectionableItem) error) error {
	for index := range *rc {
		err := iter(rc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (rc *RouteCollection) Len() int {
	return len(*rc)
}
