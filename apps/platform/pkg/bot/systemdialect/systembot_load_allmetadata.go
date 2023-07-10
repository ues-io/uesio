package systemdialect

import (
	"errors"
	"fmt"
	"reflect"

	"github.com/teris-io/shortid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func extractConditions(conditions []adapt.LoadRequestCondition) (adapt.LoadRequestCondition, adapt.LoadRequestCondition, []adapt.LoadRequestCondition, error) {

	// Verify that a type condition was provided
	var typeCondition adapt.LoadRequestCondition
	var itemCondition adapt.LoadRequestCondition
	if conditions == nil || len(conditions) <= 0 {
		return typeCondition, itemCondition, nil, errors.New("must provide at least one condition")
	}
	//item is optional it might not be provided
	if len(conditions) > 1 && conditions[1].Field == "uesio/studio.item" {
		typeCondition, itemCondition, remainingConditions := conditions[0], conditions[1], conditions[2:]
		return typeCondition, itemCondition, remainingConditions, nil
	}
	typeCondition, remainingConditions := conditions[0], conditions[1:]
	return typeCondition, itemCondition, remainingConditions, nil

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

	typeCondition, itemCondition, remainingConditions, err := extractConditions(op.Conditions)

	if typeCondition.Field != "uesio/studio.type" {
		return errors.New("the first condition must be on the type field")
	}

	group, err := meta.GetBundleableGroupFromType(typeCondition.Value.(string))
	if err != nil {
		return errors.New("invalid metadata type provided for type condition")
	}

	IsLocal := false
	QueryAll := true

	//we got item condition and it's not nil
	if !reflect.ValueOf(itemCondition).IsZero() && itemCondition.Field == "uesio/studio.item" {
		// if itemCondition.Field != "uesio/studio.item" {
		// 	return errors.New("the second condition if provided must be on the type item")
		// }
		item := itemCondition.Value.(string)
		namespace, name, err := meta.ParseKey(item)
		if err != nil {
			return err
		}

		IsLocal = app == namespace
		QueryAll = false

		//From the Item we prepare a new condition to query the DB
		//TO-DO some cool way to query by uniquekey??
		if IsLocal {
			remainingConditions = append(remainingConditions, adapt.LoadRequestCondition{
				Field: "uesio/studio.name",
				Value: name,
			})
		}

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

	remainingConditions = append(remainingConditions, adapt.LoadRequestCondition{
		Field: "uesio/studio.workspace",
		Value: inContextSession.GetWorkspaceID(),
	})

	metadata, err := datasource.Load([]*adapt.LoadOp{{
		CollectionName: group.GetName(),
		WireName:       op.WireName,
		View:           op.View,
		Collection:     op.Collection,
		Conditions:     remainingConditions,
		Fields:         datasource.GetLoadRequestFields(group.GetFields()),
		Query:          IsLocal || QueryAll,
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

	meta.Copy(dynamicCollectionMetadata, originalCollectionMetadata)
	dynamicCollectionMetadata.Name = "allmetadata"

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

	installedNamespaces := inContextSession.GetContextInstalledNamespaces()
	if workspace == "" {
		installedNamespaces = append(installedNamespaces, app)
	}

	if QueryAll {
		err = bundle.LoadAllFromNamespaces(installedNamespaces, group, nil, inContextSession, nil)
		if err != nil {
			return err
		}
	}

	//one installed element
	if !IsLocal && !QueryAll {

		//NO IDEA HOW TO DO THIS "QUERY"

		// err := bundle.LoadAllFromAny(group, meta.BundleConditions{
		// 	"uesio/studio.name": "uesio/core.bulkjob",
		// }, session, connection)
		// if err != nil {
		// 	return err
		// }

		// item := group.NewItem()
		// item.SetField("uesio/studio.namespace", "uesio/core")
		// item.SetField("uesio/core.uniquekey", "uesio/core.bulkjob")
		// groupableItem := item.(meta.BundleableItem)

		// err = bundle.Load(groupableItem, inContextSession, nil)
		// if err != nil {
		// 	return err
		// }

	}

	// Get the metadata list
	namespaces := inContextSession.GetContextNamespaces()
	appNames := []string{}
	appNames = append(appNames, namespaces...)

	appData, err := datasource.GetAppData(appNames)
	if err != nil {
		return err
	}

	err = op.Collection.Loop(func(item meta.Item, index string) error {
		appInfo, ok := appData[app]
		if !ok {
			return errors.New("invalid namespace: could not get app data")
		}

		item.SetField("uesio/studio.namespace", app)
		item.SetField("uesio/studio.appicon", appInfo.Icon)
		item.SetField("uesio/studio.appcolor", appInfo.Color)
		return nil
	})
	if err != nil {
		return err
	}

	return group.Loop(func(item meta.Item, index string) error {
		opItem := op.Collection.NewItem()
		op.Collection.AddItem(opItem)
		fakeID, _ := shortid.Generate()

		groupableItem := item.(meta.BundleableItem)
		namespace := groupableItem.GetNamespace()

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
		opItem.SetField("uesio/core.id", fakeID)
		opItem.SetField("uesio/core.uniquekey", groupableItem.GetKey())
		return nil
	})

}
