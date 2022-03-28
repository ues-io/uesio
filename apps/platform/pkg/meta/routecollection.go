package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// RouteCollection slice
type RouteCollection []Route

// GetName function
func (rc *RouteCollection) GetName() string {
	return "uesio/studio.route"
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
func (rc *RouteCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

// GetItem function
func (rc *RouteCollection) GetItem(index int) loadable.Item {
	return &(*rc)[index]
}

// Loop function
func (rc *RouteCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *rc {
		err := iter(rc.GetItem(index), strconv.Itoa(index))
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
