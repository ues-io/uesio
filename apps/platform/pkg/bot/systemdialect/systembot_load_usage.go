package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runUsageLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	metadata, err := datasource.Load([]*adapt.LoadOp{{
		CollectionName: "uesio/studio.usage",
		WireName:       op.WireName,
		View:           op.View,
		Collection:     op.Collection,
		Conditions: append(op.Conditions, adapt.LoadRequestCondition{
			Field:    "uesio/studio.site",
			Value:    session.GetContextSite().ID,
			Operator: "EQ",
		}),
		Fields: []adapt.LoadRequestField{
			{ID: "uesio/studio.actiontype"},
			{ID: "uesio/studio.app"},
			{ID: "uesio/studio.day"},
			{ID: "uesio/studio.metadataname"},
			{ID: "uesio/studio.metadatatype"},
			{ID: "uesio/studio.site"},
			{ID: "uesio/studio.total"},
			{ID: "uesio/studio.user"},
		},
		Params: op.Params,
		Query:  true,
	}}, sess.GetStudioAnonSession(), &datasource.LoadOptions{})
	if err != nil {
		return err
	}

	originalCollectionMetadata, err := metadata.GetCollection("uesio/studio.usage")
	if err != nil {
		return err
	}

	dynamicCollectionMetadata, err := connection.GetMetadata().GetCollection("uesio/core.usage")
	if err != nil {
		return err
	}

	meta.Copy(dynamicCollectionMetadata, originalCollectionMetadata)

	dynamicCollectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "user",
		Namespace:  "uesio/core",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "REFERENCE",
		Label:      "User",
		ReferenceMetadata: &adapt.ReferenceMetadata{
			Collection: "uesio/core.user",
		},
	})

	dynamicCollectionMetadata.Name = "usage"
	dynamicCollectionMetadata.Namespace = "uesio/core"

	err = datasource.GetMetadataResponse(connection.GetMetadata(), "uesio/core.user", "", session)
	if err != nil {
		return err
	}

	userRefs := adapt.ReferenceRegistry{}

	userCollectionMetadata, err := metadata.GetCollection("uesio/core.user")
	if err != nil {
		return err
	}

	refReq := userRefs.Get("uesio/core.user")
	refReq.Metadata = userCollectionMetadata

	err = op.Collection.Loop(func(item meta.Item, index string) error {
		user, err := item.GetField("uesio/studio.user")
		if err != nil {
			return err
		}

		userFieldMetadata, err := dynamicCollectionMetadata.GetField("uesio/core.user")
		if err != nil {
			return err
		}

		userIDString, ok := user.(string)
		if !ok {
			return nil
		}

		refReq.AddID(userIDString, adapt.ReferenceLocator{
			Item:  item,
			Field: userFieldMetadata,
		})
		return nil
	})
	if err != nil {
		return err
	}

	return adapt.HandleReferences(connection, userRefs, session, true)

}
