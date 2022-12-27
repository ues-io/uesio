package meta

import (
	"strconv"
)

type RouteCollection []*Route

var ROUTE_COLLECTION_NAME = "uesio/studio.route"
var ROUTE_FOLDER_NAME = "routes"

func (rc *RouteCollection) GetName() string {
	return ROUTE_COLLECTION_NAME
}

func (rc *RouteCollection) GetBundleFolderName() string {
	return ROUTE_FOLDER_NAME
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

func (rc *RouteCollection) GetItemFromPath(path string) BundleableItem {
	return &Route{Name: StandardNameFromPath(path)}
}

func (rc *RouteCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
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
