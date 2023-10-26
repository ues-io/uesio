package systemdialect

import (
	"errors"
	"fmt"
	"strings"

	"github.com/teris-io/shortid"
	"golang.org/x/exp/slices"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func extractConditionByField(conditions []adapt.LoadRequestCondition, field string) *adapt.LoadRequestCondition {
	for i, condition := range conditions {
		if condition.Field == field {
			return &conditions[i]
		}
	}
	return nil
}

func extractConditionByType(conditions []adapt.LoadRequestCondition, conditionType string) *adapt.LoadRequestCondition {
	for i, condition := range conditions {
		if condition.Type == conditionType {
			return &conditions[i]
		}
	}
	return nil
}

func GetWorkspaceIDFromParams(params map[string]string, connection adapt.Connection, session *sess.Session) (string, error) {
	workspaceid := params["workspaceid"]
	if workspaceid != "" {
		return workspaceid, nil
	}
	inContextSession, err := getContextSessionFromParams(params, connection, session)
	if err != nil {
		return "", err
	}
	return inContextSession.GetWorkspaceID(), nil
}

func getContextSessionFromParams(params map[string]string, connection adapt.Connection, session *sess.Session) (*sess.Session, error) {

	workspace := params["workspacename"]
	site := params["sitename"]
	if workspace == "" && site == "" {
		return nil, errors.New("no workspace name or site name parameter provided")
	}
	app := params["app"]
	if app == "" {
		return nil, errors.New("no app parameter provided")
	}

	if workspace != "" {
		workspaceKey := fmt.Sprintf("%s:%s", app, workspace)
		return datasource.AddWorkspaceContextByKey(workspaceKey, session, connection)
	}

	siteKey := fmt.Sprintf("%s:%s", app, site)
	return datasource.AddSiteAdminContextByKey(siteKey, session, connection)

}

func runCoreMetadataLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	newCollection := NewNamespaceSwapCollection("uesio/core", "uesio/studio")

	studioCollectionName := meta.SwapKeyNamespace(op.CollectionName, "uesio/core", "uesio/studio")

	newOp := &adapt.LoadOp{
		CollectionName: studioCollectionName,
		Collection:     newCollection,
		Conditions:     newCollection.MapConditions(op.Conditions),
		Order:          newCollection.MapOrder(op.Order),
	}

	studioConnection, err := datasource.GetPlatformConnection(nil, session, nil)
	if err != nil {
		return err
	}

	err = datasource.GetMetadataForLoad(newOp, studioConnection.GetMetadata(), nil, sess.GetStudioAnonSession())
	if err != nil {
		return err
	}

	err = runAllMetadataLoadBot(newOp, studioConnection, session)
	if err != nil {
		return err
	}

	err = newCollection.TransferFieldMetadata(studioCollectionName, studioConnection.GetMetadata(), connection.GetMetadata())
	if err != nil {
		return err
	}

	op.Collection = newCollection

	return nil

}

const (
	itemField          = "uesio/studio.item"
	groupingField      = "uesio/studio.grouping"
	allMetadataField   = "uesio/studio.allmetadata"
	isCommonFieldField = "uesio/studio.iscommonfield"
)

func runStudioMetadataLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	allMetadataCondition := extractConditionByField(op.Conditions, allMetadataField)

	if allMetadataCondition != nil && allMetadataCondition.Value == true {
		inContextSession, err := getContextSessionFromParams(op.Params, connection, session)
		if err != nil {
			return err
		}
		return runAllMetadataLoadBot(op, connection, inContextSession)
	}

	workspaceID, err := GetWorkspaceIDFromParams(op.Params, connection, session)
	if err != nil {
		return err
	}

	itemCondition := extractConditionByField(op.Conditions, itemField)
	groupingCondition := extractConditionByField(op.Conditions, groupingField)
	if itemCondition != nil || groupingCondition != nil {
		return errors.New("item or grouping conditions are not allowed unless the allmetadata condition is set")
	}

	op.Conditions = append(op.Conditions, adapt.LoadRequestCondition{
		Field: "uesio/studio.workspace",
		Value: workspaceID,
	})

	return datasource.LoadOp(op, connection, session)

}

func runAllMetadataLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	itemCondition := extractConditionByField(op.Conditions, itemField)
	groupingCondition := extractConditionByField(op.Conditions, groupingField)
	searchCondition := extractConditionByType(op.Conditions, "SEARCH")
	isCommonFieldCondition := extractConditionByField(op.Conditions, isCommonFieldField)

	metadataType := meta.GetTypeFromCollectionName(op.CollectionName)

	group, err := meta.GetBundleableGroupFromType(metadataType)
	if err != nil {
		return errors.New("invalid metadata type provided for type condition")
	}

	metadata := connection.GetMetadata()

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "namespace",
		Namespace:  "uesio/studio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Namespace",
	})

	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "appicon",
		Namespace:  "uesio/studio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "App Icon",
	})

	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "appcolor",
		Namespace:  "uesio/studio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "App Color",
	})

	namespaces := session.GetContextNamespaces()

	if itemCondition != nil {
		itemKey := getConditionValue(itemCondition)
		// If we have no value, then we can't perform the query
		if itemKey == "" {
			return nil
		}
		item, err := group.GetItemFromKey(itemKey)
		if err != nil {
			return err
		}
		group.AddItem(item)
		err = bundle.Load(item, session, connection)
		if err != nil {
			return err
		}
	} else {
		conditions := meta.BundleConditions{}
		for _, condition := range op.Conditions {
			// Ignore the special conditions
			if condition.Field == allMetadataField || condition.Type == "SEARCH" || condition.Field == isCommonFieldField {
				continue
			}
			// Special handling for the grouping condition
			if condition.Field == groupingField {
				grouping := getConditionValue(groupingCondition)
				// If we have no value, we can't perform the query
				if grouping == "" {
					return nil
				}
				groupingConditions, err := meta.GetGroupingConditions(metadataType, grouping)
				if err != nil {
					return err
				}
				for k, v := range groupingConditions {
					conditions[k] = v
				}
			} else {
				conditions[condition.Field] = getConditionValue(&condition)
			}
		}

		onlyLoadCommonFields := false

		// Special handling if we are asked to load common fields
		if op.CollectionName == "uesio/studio.field" {
			// Only add built-in fields if we're grouping on a collection
			collection, ok := conditions["uesio/studio.collection"]
			// and if we don't have a condition to exclude built-in fields
			if ok && (isCommonFieldCondition != nil && isCommonFieldCondition.Value == true) {
				onlyLoadCommonFields = true
				datasource.AddAllBuiltinFields(group, collection)
			}
		}

		if !onlyLoadCommonFields {
			err = bundle.LoadAllFromNamespaces(namespaces, group, conditions, session, nil)
			if err != nil {
				return err
			}
		}

	}

	appData, err := datasource.GetAppData(namespaces)
	if err != nil {
		return err
	}

	var itemsSlice []meta.Item

	err = group.Loop(func(item meta.Item, index string) error {

		groupableItem := item.(meta.BundleableItem)
		namespace := groupableItem.GetNamespace()
		key := groupableItem.GetKey()

		if searchCondition != nil {
			searchValue := searchCondition.Value.(string)
			if searchValue != "" {
				if !strings.Contains(key, searchValue) {
					return nil
				}
			}
		}

		opItem := op.Collection.NewItem()
		itemsSlice = append(itemsSlice, opItem)

		appInfo, ok := appData[namespace]
		if !ok {
			return errors.New("invalid namespace: could not get app data")
		}

		opItem.SetField("uesio/studio.namespace", namespace)
		opItem.SetField("uesio/studio.appicon", appInfo.Icon)
		opItem.SetField("uesio/studio.appcolor", appInfo.Color)
		// TODO: Only iterate over the Load request fields, if provided.
		// This will likely break a lot of Studio Views
		// but we need to stop sending so much unused stuff to the client.
		for _, fieldName := range group.GetFields() {
			value, err := item.GetField(fieldName)
			if err != nil {
				return err
			}
			err = opItem.SetField(fieldName, value)
			if err != nil {
				return err
			}
		}
		realID, err := item.GetField(adapt.ID_FIELD)
		if err != nil {
			return err
		}
		if realID == "" {
			fakeID, _ := shortid.Generate()
			opItem.SetField(adapt.ID_FIELD, fakeID)
		}

		opItem.SetField(adapt.UNIQUE_KEY_FIELD, key)
		return nil
	})
	if err != nil {
		return err
	}

	// Sort the items
	sortItems(itemsSlice, op.Order)

	// Now that the items are ordered, add them to the collection in order
	for _, item := range itemsSlice {
		op.Collection.AddItem(item)
	}

	return nil
}

func getStringValue(val interface{}) string {
	if stringValue, isString := val.(string); isString {
		return stringValue
	}
	return ""
}

func getConditionValue(condition *adapt.LoadRequestCondition) string {
	var conditionValue string
	if condition.Value != nil {
		conditionValue = getStringValue(condition.Value)
	} else if condition.Values != nil {
		allValues := condition.Values.([]interface{})
		if len(allValues) > 0 {
			conditionValue = getStringValue(allValues[0])
		}
	}
	return conditionValue
}

func sortItems(items []meta.Item, orderings []adapt.LoadRequestOrder) {
	// Order the collection results, by unique key ASC by default
	orderSpec := orderings
	if len(orderSpec) < 1 {
		orderSpec = []adapt.LoadRequestOrder{
			{
				Field: adapt.ID_FIELD,
				Desc:  false,
			},
		}
	}
	slices.SortStableFunc(items, func(a, b meta.Item) bool {
		for _, order := range orderSpec {
			result := compareItemsByField(a, b, order.Field)
			// If we couldn't compare the items / they were equal,
			// then move on to the next field
			if result == 0 {
				continue
			} else if result < 1 {
				return !order.Desc
			} else {
				return order.Desc
			}
		}
		return false
	})
}

// Returns false only if item a is less than b by comparing on the provided field
func compareItemsByField(a, b meta.Item, field string) int {
	aVal, err := a.GetField(field)
	if err != nil {
		return 0
	}
	bVal, err := b.GetField(field)
	if err != nil {
		return 0
	}
	// Assumption: values will be the same type
	// Return false if a's value is less than b's value
	switch typedAVal := aVal.(type) {
	case string:
		typedBVal := bVal.(string)
		return strings.Compare(typedAVal, typedBVal)
	case int64:
		typedBVal := bVal.(int64)
		if typedAVal < typedBVal {
			return -1
		} else if typedAVal == typedBVal {
			return 0
		} else {
			return 1
		}
	case float64:
		typedBVal := bVal.(float64)
		if typedAVal < typedBVal {
			return -1
		} else if typedAVal == typedBVal {
			return 0
		} else {
			return 1
		}
	case bool:
		// need to have some ordering so treat false as less than true
		typedBVal := bVal.(bool)
		if typedAVal == false && typedBVal == true {
			return -1
		} else if typedAVal == typedBVal {
			return 0
		} else {
			return 1
		}
	}
	return 0
}
