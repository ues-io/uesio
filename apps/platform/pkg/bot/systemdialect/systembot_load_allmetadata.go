package systemdialect

import (
	"errors"
	"fmt"
	"strings"

	"github.com/teris-io/shortid"

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

func runStudioMetadataLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	allMetadataCondition := extractConditionByField(op.Conditions, "uesio/studio.allmetadata")

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

	itemCondition := extractConditionByField(op.Conditions, "uesio/studio.item")
	groupingCondition := extractConditionByField(op.Conditions, "uesio/studio.grouping")
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

	itemCondition := extractConditionByField(op.Conditions, "uesio/studio.item")
	groupingCondition := extractConditionByField(op.Conditions, "uesio/studio.grouping")
	searchCondition := extractConditionByType(op.Conditions, "SEARCH")
	isCommonFieldCondition := extractConditionByField(op.Conditions, "uesio/studio.iscommonfield")

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
		var conditions meta.BundleConditions
		if groupingCondition != nil {
			grouping := getConditionValue(groupingCondition)
			// If we have no value, we can't perform the query
			if grouping == "" {
				return nil
			}
			conditions, err = meta.GetGroupingConditions(metadataType, grouping)
			if err != nil {
				return err
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

	return group.Loop(func(item meta.Item, index string) error {

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
		op.Collection.AddItem(opItem)

		appInfo, ok := appData[namespace]
		if !ok {
			return errors.New("invalid namespace: could not get app data")
		}

		opItem.SetField("uesio/studio.namespace", namespace)
		opItem.SetField("uesio/studio.appicon", appInfo.Icon)
		opItem.SetField("uesio/studio.appcolor", appInfo.Color)
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
