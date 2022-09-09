package datasource

import (
	"errors"
	"fmt"

	"github.com/teris-io/shortid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runAllMetadataLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	workspace := op.Params["workspacename"]
	site := op.Params["sitename"]
	if workspace == "" && site == "" {
		return errors.New("No Workspace Name or Site Name Parameter Provided")
	}
	app := op.Params["app"]
	if app == "" {
		return errors.New("No App Parameter Provided")
	}

	// Verify that a type condition was provided
	if op.Conditions == nil || len(op.Conditions) <= 0 {
		return errors.New("Must Provide at least one condition")
	}

	if op.Conditions[0].Field != "uesio/studio.type" {
		return errors.New("The first condition must be on the type field")
	}

	group, err := meta.GetBundleableGroupFromType(op.Conditions[0].Value.(string))
	if err != nil {
		return errors.New("Invalid Metadata Type provided for type condition")
	}

	metadata, err := Load([]*adapt.LoadOp{{
		CollectionName: group.GetName(),
		WireName:       op.WireName,
		View:           op.View,
		Collection:     op.Collection,
		Fields:         getLoadRequestFields(group.GetFields()),
		Query:          false,
	}}, session, &LoadOptions{
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

	//This creates a copy of the session
	inContextSession := session.RemoveWorkspaceContext()

	if workspace != "" {
		workspaceKey := fmt.Sprintf("%s:%s", app, workspace)
		err = AddWorkspaceContextByKey(workspaceKey, inContextSession, connection)
		if err != nil {
			return err
		}
	}

	if site != "" {
		siteKey := fmt.Sprintf("%s:%s", app, site)
		err = AddSiteAdminContextByKey(siteKey, inContextSession, connection)
		if err != nil {
			return err
		}
	}

	err = bundle.LoadAllFromAny(group, nil, inContextSession)
	if err != nil {
		return err
	}

	return group.Loop(func(item loadable.Item, index string) error {
		opItem := op.Collection.NewItem()
		fakeID, _ := shortid.Generate()

		groupableItem := item.(meta.BundleableItem)
		opItem.SetField("uesio/studio.id", fakeID)
		opItem.SetField("uesio/studio.namespace", groupableItem.GetNamespace())
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
		return nil
	})

}
