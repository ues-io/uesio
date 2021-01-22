package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// RouteCollection slice
type RouteCollection []Route

// GetName function
func (rc *RouteCollection) GetName() string {
	return "routes"
}

// GetFields function
func (rc *RouteCollection) GetFields() []string {
	return StandardGetFields(rc)
}

// NewItem function
func (rc *RouteCollection) NewItem() loadable.Item {
	return &Route{}
}

// NewBundleableItem function
func (rc *RouteCollection) NewBundleableItem() BundleableItem {
	return &Route{}
}

// NewBundleableItem function
func (rc *RouteCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewRoute(key)
}

// GetKeyFromPath function
func (rc *RouteCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// AddItem function
func (rc *RouteCollection) AddItem(item loadable.Item) {
	*rc = append(*rc, *item.(*Route))
}

// GetItem function
func (rc *RouteCollection) GetItem(index int) loadable.Item {
	return &(*rc)[index]
}

// Loop function
func (rc *RouteCollection) Loop(iter func(item loadable.Item) error) error {
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

// GetItems function
func (rc *RouteCollection) GetItems() interface{} {
	return rc
}

// Slice function
func (rc *RouteCollection) Slice(start int, end int) {

}
