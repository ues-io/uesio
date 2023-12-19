package meta

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

type RouteAssignmentCollection []*RouteAssignment

var ROUTE_ASSIGNMENT_COLLECTION_NAME = "uesio/studio.routeassignment"
var ROUTE_ASSIGNMENT_FOLDER_NAME = "routeassignments"

// We have to hardcode these fields because route assignments don't have a uesio/studio.name
// field that we want to query. If we used the StandardGetFields (like the other metadata items)
// it would try to query for a name field that does not exist.
var ROUTE_ASSIGNMENT_FIELDS = []string{
	"uesio/core.id",
	"uesio/core.uniquekey",
	"uesio/core.createdby",
	"uesio/core.owner",
	"uesio/core.updatedby",
	"uesio/core.updatedat",
	"uesio/core.createdat",
	"uesio/studio.type",
	"uesio/studio.route",
	"uesio/studio.collection",
	"uesio/studio.workspace",
	"uesio/studio.public",
}

func (rc *RouteAssignmentCollection) GetName() string {
	return ROUTE_ASSIGNMENT_COLLECTION_NAME
}

func (rc *RouteAssignmentCollection) GetBundleFolderName() string {
	return ROUTE_ASSIGNMENT_FOLDER_NAME
}

func (rc *RouteAssignmentCollection) GetFields() []string {
	return ROUTE_ASSIGNMENT_FIELDS
}

func (rc *RouteAssignmentCollection) NewItem() Item {
	return &RouteAssignment{}
}

func (rc *RouteAssignmentCollection) AddItem(item Item) error {
	*rc = append(*rc, item.(*RouteAssignment))
	return nil
}

func (rc *RouteAssignmentCollection) GetItemFromPath(path, namespace string) BundleableItem {
	parts := strings.Split(path, "/")
	collectionKey := fmt.Sprintf("%s/%s.%s", parts[0], parts[1], parts[2])
	viewType := strings.TrimSuffix(parts[3], ".yaml")
	return NewBaseRouteAssignment(collectionKey, namespace, viewType)
}

func (rc *RouteAssignmentCollection) GetItemFromKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ":")
	if (len(keyArray)) != 2 {
		return nil, errors.New("Invalid Route Assignment Key")
	}
	namespace, viewType, err := ParseKey(keyArray[1])
	if err != nil {
		return nil, errors.New("Bad Key for RouteAssignment: " + key)
	}
	return NewRouteAssignment(keyArray[0], namespace, viewType)
}

func (rc *RouteAssignmentCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return GroupedPathFilter(path, "uesio/studio.collection", conditions)
}

func (rc *RouteAssignmentCollection) Loop(iter GroupIterator) error {
	for index, r := range *rc {
		err := iter(r, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (rc *RouteAssignmentCollection) Len() int {
	return len(*rc)
}
