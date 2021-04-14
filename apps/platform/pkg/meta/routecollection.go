package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// RouteCollection slice
type RouteCollection []Route

// GetName function
func (rc *RouteCollection) GetName() string {
	return "studio.routes"
}

// GetFields function
func (rc *RouteCollection) GetFields() []string {
	return StandardGetFields(&Route{})
}

// NewItem function
func (rc *RouteCollection) NewItem() loadable.Item {
	*rc = append(*rc, Route{})
	return &(*rc)[len(*rc)-1]
}

// NewBundleableItemWithKey function
func (rc *RouteCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	r, err := NewRoute(key)
	if err != nil {
		return nil, err
	}
	*rc = append(*rc, *r)
	return &(*rc)[len(*rc)-1], nil
}

// GetKeyFromPath function
func (rc *RouteCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
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
	return *rc
}

// Slice function
func (rc *RouteCollection) Slice(start int, end int) {

}
func (bc *RouteCollection) Filter(iter func(item loadable.Item) (bool, error)) error {
	return nil
}
