package meta

import (
	"strconv"
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

func (rc *RouteCollection) NewItem() Item {
	return &Route{}
}

func (rc *RouteCollection) AddItem(item Item) {
	*rc = append(*rc, item.(*Route))
}

func (rc *RouteCollection) GetItemFromPath(path string) (BundleableItem, bool) {
	return &Route{Name: StandardNameFromPath(path)}, true
}

func (rc *RouteCollection) FilterPath(path string, conditions BundleConditions) bool {
	return StandardPathFilter(path)
}

func (rc *RouteCollection) GetItem(index int) Item {
	return (*rc)[index]
}

func (rc *RouteCollection) Loop(iter GroupIterator) error {
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
