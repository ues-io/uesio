package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type RouteCollection []*Route

func (rc *RouteCollection) GetName() string {
	return "uesio/studio.route"
}

func (rc *RouteCollection) GetBundleFolderName() string {
	return "routes"
}

func (rc *RouteCollection) GetFields() []string {
	return StandardGetFields(&Route{})
}

func (rc *RouteCollection) NewItem() loadable.Item {
	r := &Route{}
	*rc = append(*rc, r)
	return r
}

func (rc *RouteCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	r, err := NewRoute(key)
	if err != nil {
		return nil, err
	}
	*rc = append(*rc, r)
	return r, nil
}

func (rc *RouteCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (rc *RouteCollection) GetItem(index int) loadable.Item {
	return (*rc)[index]
}

func (rc *RouteCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *rc {
		err := iter(rc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (rc *RouteCollection) Len() int {
	return len(*rc)
}

func (rc *RouteCollection) GetItems() interface{} {
	return *rc
}
