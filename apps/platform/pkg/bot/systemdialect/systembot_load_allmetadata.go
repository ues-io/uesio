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

	//This creates a copy of the session
	inContextSession := session.RemoveWorkspaceContext()

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
		err := datasource.AddWorkspaceContextByKey(workspaceKey, inContextSession, connection)
		if err != nil {
			return nil, err
		}
	}

	if site != "" {
		siteKey := fmt.Sprintf("%s:%s", app, site)
		err := datasource.AddSiteAdminContextByKey(siteKey, inContextSession, connection)
		if err != nil {
			return nil, err
		}
	}
	return inContextSession, nil
}

func runStudioMetadataLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	allMetadataCondition := extractConditionByField(op.Conditions, "uesio/studio.allmetadata")

	if allMetadataCondition != nil && allMetadataCondition.Value == true {
		return runAllMetadataLoadBot(op.CollectionName, op, connection, session)
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

func runAllMetadataLoadBot(collectionName string, op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	inContextSession, err := getContextSessionFromParams(op.Params, connection, session)
	if err != nil {
		return err
	}

	itemCondition := extractConditionByField(op.Conditions, "uesio/studio.item")
	groupingCondition := extractConditionByField(op.Conditions, "uesio/studio.grouping")
	searchCondition := extractConditionByType(op.Conditions, "SEARCH")
	displayBuiltInFieldsCondition := extractConditionByField(op.Conditions, "uesio/studio.displaybuiltinfields")

	metadataType := meta.GetTypeFromCollectionName(collectionName)

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

	namespaces := inContextSession.GetContextNamespaces()

	if itemCondition != nil {
		itemKey := itemCondition.Value.(string)
		item, err := group.GetItemFromKey(itemKey)
		if err != nil {
			return err
		}
		group.AddItem(item)
		err = bundle.Load(item, inContextSession, connection)
		if err != nil {
			return err
		}
	} else {
		var conditions meta.BundleConditions
		if groupingCondition != nil {
			grouping := groupingCondition.Value.(string)
			conditions, err = meta.GetGroupingConditions(metadataType, grouping)
			if err != nil {
				return err
			}
		}

		err = bundle.LoadAllFromNamespaces(namespaces, group, conditions, inContextSession, nil)
		if err != nil {
			return err
		}

		// Special handling for built-in fields
		if collectionName == "uesio/studio.field" {
			// Only add built-in fields if we're grouping on a collection
			collection, ok := conditions["uesio/studio.collection"]
			// and if we don't have a condition to exclude built-in fields
			if ok && (displayBuiltInFieldsCondition == nil || displayBuiltInFieldsCondition.Value != false) {
				datasource.AddAllBuiltinFields(group, collection)
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
		realID, err := item.GetField("uesio/core.id")
		if err != nil {
			return err
		}
		if realID == "" {
			fakeID, _ := shortid.Generate()
			opItem.SetField("uesio/core.id", fakeID)
		}

		opItem.SetField("uesio/core.uniquekey", key)
		return nil
	})

}
