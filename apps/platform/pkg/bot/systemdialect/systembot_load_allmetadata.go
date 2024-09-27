package systemdialect

import (
	"errors"
	"slices"
	"strings"

	"github.com/teris-io/shortid"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/file"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func extractConditionByField(conditions []wire.LoadRequestCondition, field string) *wire.LoadRequestCondition {
	for i, condition := range conditions {
		if condition.Field == field {
			return &conditions[i]
		}
	}
	return nil
}

func extractConditionByType(conditions []wire.LoadRequestCondition, conditionType string) *wire.LoadRequestCondition {
	for i, condition := range conditions {
		if condition.Type == conditionType {
			return &conditions[i]
		}
	}
	return nil
}

func runCoreMetadataLoadBot(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

	newCollection := NewNamespaceSwapCollection("uesio/core", "uesio/studio")

	studioCollectionName := meta.SwapKeyNamespace(op.CollectionName, "uesio/core", "uesio/studio")

	newOp := &wire.LoadOp{
		BatchSize:      op.BatchSize,
		BatchNumber:    op.BatchNumber,
		CollectionName: studioCollectionName,
		Collection:     newCollection,
		Conditions:     newCollection.MapConditions(op.Conditions),
		Order:          newCollection.MapOrder(op.Order),
	}

	studioMetadata := &wire.MetadataCache{}

	err := datasource.GetMetadataForLoad(newOp, studioMetadata, nil, sess.GetStudioAnonSession(session.Context()), connection)
	if err != nil {
		return err
	}

	err = runAllMetadataLoadBot(newOp, connection, session)
	if err != nil {
		return err
	}

	coreMetadata, err := op.GetMetadata()
	if err != nil {
		return err
	}

	err = newCollection.TransferFieldMetadata(studioCollectionName, studioMetadata, coreMetadata)
	if err != nil {
		return err
	}

	for _, item := range newCollection.collection {
		newItem := op.Collection.NewItem()
		err := item.Loop(func(s string, i interface{}) error {
			return newItem.SetField(s, i)
		})
		if err != nil {
			return err
		}
		op.Collection.AddItem(newItem)
	}

	return nil

}

const (
	itemField          = "uesio/studio.item"
	groupingField      = "uesio/studio.grouping"
	namespaceField     = "uesio/studio.namespace"
	tagField           = "uesio/studio.tag"
	labelField         = "uesio/studio.label"
	appIconField       = "uesio/studio.appicon"
	appColorField      = "uesio/studio.appcolor"
	appNameField       = "uesio/studio.appname"
	allMetadataField   = "uesio/studio.allmetadata"
	isCommonFieldField = "uesio/studio.iscommonfield"
	attachmentsField   = "uesio/studio.attachments"
)

func runStudioMetadataLoadBot(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

	allMetadataCondition := extractConditionByField(op.Conditions, allMetadataField)

	if allMetadataCondition != nil && allMetadataCondition.Value == true {
		inContextSession, err := datasource.GetContextSessionFromParams(op.Params, connection, session)
		if err != nil {
			return err
		}
		return runAllMetadataLoadBot(op, connection, inContextSession)
	}

	// Get the workspace ID from params, and verify that the user performing the query
	// has write access to the requested workspace

	wsAccessResult := datasource.RequestWorkspaceWriteAccess(op.Params, connection, session)
	if !wsAccessResult.HasWriteAccess() {
		return wsAccessResult.Error()
	}

	itemCondition := extractConditionByField(op.Conditions, itemField)
	groupingCondition := extractConditionByField(op.Conditions, groupingField)
	tagCondition := extractConditionByField(op.Conditions, tagField)
	if itemCondition != nil || groupingCondition != nil || tagCondition != nil {
		return errors.New("item, tag or grouping conditions are not allowed unless the allmetadata condition is set")
	}

	if !wsAccessResult.IsSiteAdmin() {
		op.Conditions = append(op.Conditions, wire.LoadRequestCondition{
			Field: "uesio/studio.workspace",
			Value: wsAccessResult.GetWorkspaceID(),
		})
	}

	return datasource.LoadOp(op, connection, session)

}

func isDefaultOrder(order []wire.LoadRequestOrder) bool {
	if len(order) != 1 {
		return false
	}
	defaultOrder := datasource.GetDefaultOrder()
	return order[0] == defaultOrder
}

var namespaceFieldMeta = &wire.FieldMetadata{
	Name:       "namespace",
	Namespace:  "uesio/studio",
	Createable: false,
	Accessible: true,
	Updateable: false,
	Type:       "TEXT",
	Label:      "Namespace",
}

var appiconFieldMeta = &wire.FieldMetadata{
	Name:       "appicon",
	Namespace:  "uesio/studio",
	Createable: false,
	Accessible: true,
	Updateable: false,
	Type:       "TEXT",
	Label:      "App Icon",
}

var appcolorFieldMeta = &wire.FieldMetadata{
	Name:       "appcolor",
	Namespace:  "uesio/studio",
	Createable: false,
	Accessible: true,
	Updateable: false,
	Type:       "TEXT",
	Label:      "App Color",
}

var appnameFieldMeta = &wire.FieldMetadata{
	Name:       "appname",
	Namespace:  "uesio/studio",
	Createable: false,
	Accessible: true,
	Updateable: false,
	Type:       "TEXT",
	Label:      "App Name",
}

var attachmentsFieldMeta = &wire.FieldMetadata{
	Name:       "attachments",
	Namespace:  "uesio/studio",
	Createable: false,
	Accessible: true,
	Updateable: false,
	Type:       "LIST",
	Label:      "Attachments",
	SubType:    "STRUCT",
	SubFields: map[string]*wire.FieldMetadata{
		"path": {
			Name:  "path",
			Type:  "TEXT",
			Label: "Path",
		},
		"mimetype": {
			Name:  "mimetype",
			Type:  "TEXT",
			Label: "Mime Type",
		},
		"size": {
			Name:  "filesize",
			Type:  "NUMBER",
			Label: "File Size",
		},
		"modified": {
			Name:  "modified",
			Type:  "TIMESTAMP",
			Label: "Last Modified",
		},
	},
}

var fakeFields = []string{
	"uesio/studio.namespace",
	"uesio/studio.appicon",
	"uesio/studio.appcolor",
	"uesio/studio.appname",
	"uesio/studio.attachments",
}

func setField(fieldName string, from, to meta.Item) error {
	// Don't set the unique key field
	if fieldName == "uesio/studio.uniquekey" {
		return nil
	}
	value, err := from.GetField(fieldName)
	if err != nil {
		return err
	}
	return to.SetField(fieldName, value)
}

func runAllMetadataLoadBot(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

	itemCondition := extractConditionByField(op.Conditions, itemField)
	tagCondition := extractConditionByField(op.Conditions, tagField)
	groupingCondition := extractConditionByField(op.Conditions, groupingField)
	namespaceCondition := extractConditionByField(op.Conditions, namespaceField)
	searchCondition := extractConditionByType(op.Conditions, "SEARCH")
	isCommonFieldCondition := extractConditionByField(op.Conditions, isCommonFieldField)

	metadataType := meta.GetTypeFromCollectionName(op.CollectionName)

	group, err := meta.GetBundleableGroupFromType(metadataType)
	if err != nil {
		return errors.New("invalid metadata type provided for type condition")
	}

	metadata, err := op.GetMetadata()
	if err != nil {
		return err
	}

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	useLegacyFieldsLoader := len(op.Fields) <= 2

	var requestFields []wire.LoadRequestField

	if !useLegacyFieldsLoader {
		for _, field := range op.Fields {
			if slices.Contains(fakeFields, field.ID) {
				continue
			}
			requestFields = append(requestFields, field)
		}
	}

	// If we weren't provided with an order, or the current order is the same as the default,
	// use a custom order that is more helpful
	if len(op.Order) == 0 || isDefaultOrder(op.Order) {
		op.Order = []wire.LoadRequestOrder{
			{
				Field: commonfields.UpdatedAt,
				Desc:  true,
			},
			{
				Field: commonfields.Id,
				Desc:  true,
			},
		}
	}

	collectionMetadata.SetField(namespaceFieldMeta)
	collectionMetadata.SetField(appiconFieldMeta)
	collectionMetadata.SetField(appcolorFieldMeta)
	collectionMetadata.SetField(appnameFieldMeta)

	// Determine the namespaces to request using a namespace condition, if present and active,
	// otherwise use all context namespaces
	var namespaces []string
	if namespaceCondition != nil && !namespaceCondition.Inactive {
		if namespacesVal, ok := goutils.StringSliceValue(getConditionValue(namespaceCondition)); ok {
			namespaces = namespacesVal
		}
	}
	if namespaces == nil {
		namespaces = session.GetContextNamespaces()
	}

	if itemCondition != nil {
		itemKey := goutils.StringValue(getConditionValue(itemCondition))
		// If we have no value, then we can't perform the query
		if itemKey == "" {
			return nil
		}
		item, err := group.GetItemFromKey(itemKey)
		if err != nil {
			return err
		}
		group.AddItem(item)
		err = bundle.Load(item, &bundlestore.GetItemOptions{
			IncludeUserFields: true,
		}, session, connection)
		if err != nil {
			return err
		}

	} else {
		conditions := meta.BundleConditions{}
		for _, condition := range op.Conditions {
			// Ignore the special conditions
			if condition.Field == allMetadataField ||
				condition.Type == "SEARCH" ||
				condition.Field == isCommonFieldField ||
				condition.Field == namespaceField ||
				condition.Field == tagField {
				continue
			}
			// Special handling for the grouping condition
			if condition.Field == groupingField {
				grouping := getConditionValue(groupingCondition)
				// If we have no value, we can't perform the query
				if meta.IsNilGroupingValue(grouping) {
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
			conditionVal, ok := conditions["uesio/studio.collection"]
			var collection string
			if ok && conditionVal != nil && conditionVal != "" {
				collection = goutils.StringValue(conditionVal)
			}
			// and if we don't have a condition to exclude built-in fields
			if ok && collection != "" && (isCommonFieldCondition != nil && isCommonFieldCondition.Value == true) {
				onlyLoadCommonFields = true
				datasource.AddAllBuiltinFields(group, collection)
			}
		}

		if !onlyLoadCommonFields {
			err = bundle.LoadAllFromNamespaces(namespaces, group, &bundlestore.GetAllItemsOptions{
				Conditions:        conditions,
				IncludeUserFields: true,
				Fields:            requestFields,
			}, session, connection)
			if err != nil {
				return err
			}
		}

	}

	appData, err := datasource.GetAppData(session.Context(), namespaces, connection)
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

		if tagCondition != nil {
			tagValue := tagCondition.Value.(string)
			if tagValue != "" {
				tags, err := item.GetField("uesio/studio.tags")
				if err != nil {
					return nil
				}
				if tags == nil {
					return nil
				}
				tagSlice, ok := tags.([]string)
				if !ok {
					return nil
				}
				if !slices.Contains(tagSlice, tagValue) {
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

		_, appName, _ := meta.ParseNamespace(namespace)

		// TODO: Remove this section in favor of the more performant.
		// Version that only returns fields if they are requested.
		// This will likely break a lot of Studio Views
		// but we need to stop sending so much unused stuff to the client.
		if useLegacyFieldsLoader {
			opItem.SetField(namespaceField, namespace)
			opItem.SetField(appIconField, appInfo.Icon)
			opItem.SetField(appColorField, appInfo.Color)
			opItem.SetField(appNameField, appName)
			for _, fieldName := range group.GetFields() {
				err := setField(fieldName, item, opItem)
				if err != nil {
					return err
				}
			}
			// Set the label to the label or name, whichever is provided.
			// Do this here, before the loop over the requested fields,
			// to ensure it doesn't get overridden.
			opItem.SetField(labelField, groupableItem.GetLabel())
			opItem.SetField(commonfields.UniqueKey, key)
			return nil
		}
		for _, field := range op.Fields {
			fieldName := field.ID
			if fieldName == attachmentsField {
				// Also get attachments
				attachableItem, isAttachableItem := item.(meta.AttachableItem)
				if isAttachableItem {
					pathInfo, err := bundle.GetAttachmentPaths(attachableItem, session, connection)
					if err != nil {
						return err
					}
					collectionMetadata.SetField(attachmentsFieldMeta)
					pathInfoWrappers := make([]file.MetadataWrapper, len(pathInfo))
					for i, path := range pathInfo {
						pathInfoWrappers[i] = file.MetadataWrapper{Metadata: path}
					}
					opItem.SetField(fieldName, pathInfoWrappers)
				}
				continue
			}
			if fieldName == namespaceField {
				opItem.SetField(fieldName, namespace)
				continue
			}
			if fieldName == appIconField {
				opItem.SetField(fieldName, appInfo.Icon)
				continue
			}
			if fieldName == appColorField {
				opItem.SetField(fieldName, appInfo.Color)
				continue
			}
			if fieldName == appNameField {
				opItem.SetField(fieldName, appName)
				continue
			}

			if fieldName == labelField {
				opItem.SetField(fieldName, groupableItem.GetLabel())
				continue
			}

			if fieldName == commonfields.UniqueKey {
				opItem.SetField(fieldName, key)
				continue
			}

			err := setField(fieldName, item, opItem)
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return err
	}

	// Sort the items
	sortItems(itemsSlice, op.Order)

	// Now that the items are ordered, add them to the collection in order,
	// but only add the ones for the batch we are currently looking at
	op.HasMoreBatches = false
	totalSize := len(itemsSlice)
	startIdx := 0
	endIdx := totalSize
	if op.BatchSize != 0 {
		startIdx = op.BatchNumber * op.BatchSize
		endIdx = startIdx + op.BatchSize
		if totalSize > endIdx+1 {
			op.HasMoreBatches = true
		}
		// Make sure that end idx doesn't overflow the slice
		if endIdx > totalSize {
			endIdx = totalSize
		}
	}

	for _, item := range itemsSlice[startIdx:endIdx] {
		realID, err := item.GetField(commonfields.Id)
		if err != nil {
			return err
		}
		if realID == "" {
			fakeID, _ := shortid.Generate()
			item.SetField(commonfields.Id, fakeID)
		}
		op.Collection.AddItem(item)
	}

	return nil
}

func getConditionValue(condition *wire.LoadRequestCondition) interface{} {
	if condition.Value != nil {
		return goutils.StringValue(condition.Value)
	} else if condition.Values != nil {
		if stringSliceValues, isSlice := goutils.StringSliceValue(condition.Values); isSlice {
			return stringSliceValues
		}
	}
	return nil
}

func sortItems(items []meta.Item, orderings []wire.LoadRequestOrder) {
	if len(orderings) == 0 {
		return
	}
	// Order the collection results
	slices.SortStableFunc(items, func(a, b meta.Item) int {
		for i := range orderings {
			order := orderings[i]
			result := compareItemsByField(a, b, order.Field)
			// If we couldn't compare the items / they were equal,
			// then move on to the next field
			if result == 0 {
				continue
			} else if result < 1 {
				if order.Desc {
					return 1
				}
				return -1
			} else {
				if order.Desc {
					return -1
				}
				return 1
			}
		}
		return 0
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
