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

func extractConditions(conditions []adapt.LoadRequestCondition) (*adapt.LoadRequestCondition, *adapt.LoadRequestCondition, *adapt.LoadRequestCondition, *adapt.LoadRequestCondition, error) {

	// Verify that a type condition was provided
	var typeCondition *adapt.LoadRequestCondition
	var itemCondition *adapt.LoadRequestCondition
	var groupingCondition *adapt.LoadRequestCondition
	var searchCondition *adapt.LoadRequestCondition

	for i, condition := range conditions {
		if condition.Field == "uesio/studio.type" {
			typeCondition = &conditions[i]
			continue
		}
		if condition.Field == "uesio/studio.item" {
			itemCondition = &conditions[i]
			continue
		}
		if condition.Field == "uesio/studio.grouping" {
			groupingCondition = &conditions[i]
			continue
		}
		if condition.Type == "SEARCH" {
			searchCondition = &conditions[i]
			continue
		}
	}
	if typeCondition == nil {
		return nil, nil, nil, nil, errors.New("No type condition provided")
	}
	if itemCondition != nil && groupingCondition != nil {
		return nil, nil, nil, nil, errors.New("Can't have both an item and grouping condition")
	}
	return typeCondition, itemCondition, groupingCondition, searchCondition, nil
}

func runAllMetadataLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	workspace := op.Params["workspacename"]
	site := op.Params["sitename"]
	if workspace == "" && site == "" {
		return errors.New("no workspace name or site name parameter provided")
	}
	app := op.Params["app"]
	if app == "" {
		return errors.New("no app parameter provided")
	}

	// Verify that a type condition was provided
	if op.Conditions == nil || len(op.Conditions) <= 0 {
		return errors.New("must provide at least one condition")
	}

	typeCondition, itemCondition, groupingCondition, searchCondition, err := extractConditions(op.Conditions)
	if err != nil {
		return err
	}

	metadataType := typeCondition.Value.(string)

	group, err := meta.GetBundleableGroupFromType(metadataType)
	if err != nil {
		return errors.New("invalid metadata type provided for type condition")
	}

	//This creates a copy of the session
	inContextSession := session.RemoveWorkspaceContext()

	if workspace != "" {
		workspaceKey := fmt.Sprintf("%s:%s", app, workspace)
		err = datasource.AddWorkspaceContextByKey(workspaceKey, inContextSession, connection)
		if err != nil {
			return err
		}
	}

	if site != "" {
		siteKey := fmt.Sprintf("%s:%s", app, site)
		err = datasource.AddSiteAdminContextByKey(siteKey, inContextSession, connection)
		if err != nil {
			return err
		}
	}

	metadata, err := datasource.Load([]*adapt.LoadOp{{
		CollectionName: group.GetName(),
		WireName:       op.WireName,
		View:           op.View,
		Collection:     op.Collection,
		Fields:         datasource.GetLoadRequestFields(group.GetFields()),
		Query:          false,
	}}, session, &datasource.LoadOptions{
		Metadata: connection.GetMetadata(),
	})
	if err != nil {
		return err
	}

	originalCollectionMetadata, err := metadata.GetCollection(group.GetName())
	if err != nil {
		return err
	}

	dynamicCollectionMetadata, err := metadata.GetCollection("uesio/studio.allmetadata")
	if err != nil {
		return err
	}

	for _, field := range originalCollectionMetadata.Fields {
		dynamicCollectionMetadata.SetField(field)
	}

	dynamicCollectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "namespace",
		Namespace:  "uesio/studio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Namespace",
	})

	dynamicCollectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "appicon",
		Namespace:  "uesio/studio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "App Icon",
	})

	dynamicCollectionMetadata.SetField(&adapt.FieldMetadata{
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
