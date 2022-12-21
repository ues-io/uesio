package datasource

import (
	"fmt"

	"github.com/gomodule/redigo/redis"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetKeys(pattern string) ([]string, error) {

	conn := cache.GetRedisConn()
	defer conn.Close()

	iter := 0
	keys := []string{}
	for {
		arr, err := redis.Values(conn.Do("SCAN", iter, "MATCH", pattern))
		if err != nil {
			return keys, fmt.Errorf("error retrieving '%s' keys", pattern)
		}

		iter, _ = redis.Int(arr[0], nil)
		k, _ := redis.Strings(arr[1], nil)
		keys = append(keys, k...)

		if iter == 0 {
			break
		}
	}

	return keys, nil
}

func runRedisLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	//userID := session.GetUserID()

	keys, err := GetKeys("session:*")
	if err != nil {
		return err
	}
	println(keys)

	return nil

	// workspace := op.Params["workspacename"]
	// site := op.Params["sitename"]
	// if workspace == "" && site == "" {
	// 	return errors.New("No Workspace Name or Site Name Parameter Provided")
	// }
	// app := op.Params["app"]
	// if app == "" {
	// 	return errors.New("No App Parameter Provided")
	// }

	// // Verify that a type condition was provided
	// if op.Conditions == nil || len(op.Conditions) <= 0 {
	// 	return errors.New("Must Provide at least one condition")
	// }

	// typeCondition, remainingConditions := op.Conditions[0], op.Conditions[1:]

	// if typeCondition.Field != "uesio/studio.type" {
	// 	return errors.New("The first condition must be on the type field")
	// }

	// group, err := meta.GetBundleableGroupFromType(typeCondition.Value.(string))
	// if err != nil {
	// 	return errors.New("Invalid Metadata Type provided for type condition")
	// }

	// //This creates a copy of the session
	// inContextSession := session.RemoveWorkspaceContext()

	// if workspace != "" {
	// 	workspaceKey := fmt.Sprintf("%s:%s", app, workspace)
	// 	err = AddWorkspaceContextByKey(workspaceKey, inContextSession, connection)
	// 	if err != nil {
	// 		return err
	// 	}
	// }

	// if site != "" {
	// 	siteKey := fmt.Sprintf("%s:%s", app, site)
	// 	err = AddSiteAdminContextByKey(siteKey, inContextSession, connection)
	// 	if err != nil {
	// 		return err
	// 	}
	// }

	// remainingConditions = append(remainingConditions, adapt.LoadRequestCondition{
	// 	Field: "uesio/studio.workspace",
	// 	Value: inContextSession.GetWorkspaceID(),
	// })

	// metadata, err := Load([]*adapt.LoadOp{{
	// 	CollectionName: group.GetName(),
	// 	WireName:       op.WireName,
	// 	View:           op.View,
	// 	Collection:     op.Collection,
	// 	Conditions:     remainingConditions,
	// 	Fields:         getLoadRequestFields(group.GetFields()),
	// 	Query:          true,
	// }}, session, &LoadOptions{
	// 	Metadata: connection.GetMetadata(),
	// })
	// if err != nil {
	// 	return err
	// }

	// originalCollectionMetadata, err := metadata.GetCollection(group.GetName())
	// if err != nil {
	// 	return err
	// }

	// dynamicCollectionMetadata, err := metadata.GetCollection("uesio/studio.allmetadata")
	// if err != nil {
	// 	return err
	// }

	// meta.Copy(dynamicCollectionMetadata, originalCollectionMetadata)
	// dynamicCollectionMetadata.Name = "allmetadata"

	// dynamicCollectionMetadata.SetField(&adapt.FieldMetadata{
	// 	Name:       "namespace",
	// 	Namespace:  "uesio/studio",
	// 	Createable: false,
	// 	Accessible: true,
	// 	Updateable: false,
	// 	Type:       "TEXT",
	// 	Label:      "Namespace",
	// })

	// dynamicCollectionMetadata.SetField(&adapt.FieldMetadata{
	// 	Name:       "appicon",
	// 	Namespace:  "uesio/studio",
	// 	Createable: false,
	// 	Accessible: true,
	// 	Updateable: false,
	// 	Type:       "TEXT",
	// 	Label:      "App Icon",
	// })

	// dynamicCollectionMetadata.SetField(&adapt.FieldMetadata{
	// 	Name:       "appcolor",
	// 	Namespace:  "uesio/studio",
	// 	Createable: false,
	// 	Accessible: true,
	// 	Updateable: false,
	// 	Type:       "TEXT",
	// 	Label:      "App Color",
	// })

	// installedNamespaces := inContextSession.GetContextInstalledNamespaces()
	// if workspace == "" {
	// 	installedNamespaces = append(installedNamespaces, app)
	// }

	// err = bundle.LoadAllFromNamespaces(installedNamespaces, group, nil, inContextSession, nil)
	// if err != nil {
	// 	return err
	// }

	// // Get the metadata list
	// namespaces := inContextSession.GetContextNamespaces()
	// appNames := []string{}
	// for _, ns := range namespaces {
	// 	appNames = append(appNames, ns)
	// }

	// appData, err := GetAppData(appNames)
	// if err != nil {
	// 	return err
	// }

	// err = op.Collection.Loop(func(item meta.Item, index string) error {
	// 	appInfo, ok := appData[app]
	// 	if !ok {
	// 		return errors.New("Invalid Namespace: Could not get app data")
	// 	}

	// 	item.SetField("uesio/studio.namespace", app)
	// 	item.SetField("uesio/studio.appicon", appInfo.Icon)
	// 	item.SetField("uesio/studio.appcolor", appInfo.Color)
	// 	return nil
	// })
	// if err != nil {
	// 	return err
	// }

	// return group.Loop(func(item meta.Item, index string) error {
	// 	opItem := op.Collection.NewItem()
	// 	op.Collection.AddItem(opItem)
	// 	fakeID, _ := shortid.Generate()

	// 	groupableItem := item.(meta.BundleableItem)
	// 	namespace := groupableItem.GetNamespace()

	// 	appInfo, ok := appData[namespace]
	// 	if !ok {
	// 		return errors.New("Invalid Namespace: Could not get app data")
	// 	}
	// 	opItem.SetField("uesio/studio.namespace", namespace)
	// 	opItem.SetField("uesio/studio.appicon", appInfo.Icon)
	// 	opItem.SetField("uesio/studio.appcolor", appInfo.Color)
	// 	for _, fieldName := range group.GetFields() {
	// 		value, err := item.GetField(fieldName)
	// 		if err != nil {
	// 			return err
	// 		}
	// 		err = opItem.SetField(fieldName, value)
	// 		if err != nil {
	// 			return err
	// 		}
	// 	}
	// 	opItem.SetField("uesio/core.id", fakeID)
	// 	opItem.SetField("uesio/core.uniquekey", groupableItem.GetKey())
	// 	return nil
	// })

}
