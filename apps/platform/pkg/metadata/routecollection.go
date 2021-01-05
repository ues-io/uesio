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
func (rc *RouteCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(rc)
}

// NewItem function
func (rc *RouteCollection) NewItem() LoadableItem {
	return &Route{}
}

// NewBundleableItem function
func (rc *RouteCollection) NewBundleableItem(key string) (BundleableItem, error) {
	return NewRoute(key)
}

// GetKeyPrefix function
func (rc *RouteCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (rc *RouteCollection) AddItem(item LoadableItem) {
	*rc = append(*rc, *item.(*Route))
}

// GetItem function
func (rc *RouteCollection) GetItem(index int) LoadableItem {
	actual := *rc
	return &actual[index]
}

// Loop function
func (rc *RouteCollection) Loop(iter func(item LoadableItem) error) error {
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
