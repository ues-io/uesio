package meta

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type RouteAssignmentCollection []*RouteAssignment

var ROUTE_ASSIGNMENT_COLLECTION_NAME = "uesio/studio.routeassignment"
var ROUTE_ASSIGNMENT_FOLDER_NAME = "routeassignments"

// We have to hardcode these fields because translations don't have a uesio/studio.name
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
	parts := strings.Split(path, string(os.PathSeparator))
	collectionKey := fmt.Sprintf("%s/%s.%s", parts[0], parts[1], parts[2])
	viewType := strings.TrimSuffix(parts[3], ".yaml")
	return NewBaseRouteAssignment(collectionKey, namespace, viewType)
}

func (rc *RouteAssignmentCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	collectionKey, hasCollection := conditions["uesio/studio.collection"]
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 4 || !strings.HasSuffix(parts[3], ".yaml") {
		// Ignore this file
		return false
	}
	if hasCollection {
		collectionNS, collectionName, err := ParseKey(collectionKey)
		if err != nil {
			return false
		}
		nsUser, nsApp, err := ParseNamespace(collectionNS)
		if err != nil {
			return false
		}
		if parts[0] != nsUser || parts[1] != nsApp || parts[2] != collectionName {
			return false
		}
	}
	return true
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
