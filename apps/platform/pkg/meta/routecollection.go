package meta

import (
	"strconv"
)

type RouteCollection []*Route

var ROUTE_COLLECTION_NAME = "uesio/studio.route"
var ROUTE_FOLDER_NAME = "routes"
var ROUTE_FIELDS = StandardGetFields(&Route{})

func (rc *RouteCollection) GetName() string {
	return ROUTE_COLLECTION_NAME
}

func (rc *RouteCollection) GetBundleFolderName() string {
	return ROUTE_FOLDER_NAME
}

func (rc *RouteCollection) GetFields() []string {
	return ROUTE_FIELDS
}

func (rc *RouteCollection) NewItem() Item {
	return &Route{}
}

func (rc *RouteCollection) AddItem(item Item) {
	*rc = append(*rc, item.(*Route))
}

func (rc *RouteCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseRoute(namespace, StandardNameFromPath(path))
}

func (rc *RouteCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (rc *RouteCollection) Loop(iter GroupIterator) error {
	for index, r := range *rc {
		err := iter(r, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (rc *RouteCollection) Len() int {
	return len(*rc)
}
