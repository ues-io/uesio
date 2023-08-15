package systemdialect

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func mapConditions(coreConditions []adapt.LoadRequestCondition) []adapt.LoadRequestCondition {

	var studioConditions []adapt.LoadRequestCondition

	for _, elem := range coreConditions {
		elem.Field = strings.Replace(elem.Field, "uesio/core.", "uesio/studio.", 1)
		studioConditions = append(studioConditions, elem)
	}

	return studioConditions
}

func mapFields(fields []adapt.LoadRequestField, studioItem meta.Item, coreItem meta.Item) meta.Item {

	for _, field := range fields {
		res, _ := studioItem.GetField(field.ID)
		coreItem.SetField(strings.Replace(field.ID, "uesio/studio.", "uesio/core.", 1), res)
	}

	return coreItem
}

func runUsageLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	siteAdmin := session.GetSiteAdmin()

	if siteAdmin == nil {
		return errors.New("unable to retrieve usage, site admin context is missing")
	}

	newOp := &adapt.LoadOp{
		CollectionName: "uesio/studio.usage",
		WireName:       "loadStudioUsage",
		View:           op.View,
		Collection:     &adapt.Collection{},
		Conditions: append(mapConditions(op.Conditions), adapt.LoadRequestCondition{
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
		Order:     []adapt.LoadRequestOrder{{Field: "uesio/studio.day", Desc: true}},
		Query:     true,
		BatchSize: op.BatchSize,
		LoadAll:   op.LoadAll,
		Params:    op.Params,
	}

	_, err := datasource.Load([]*adapt.LoadOp{newOp}, sess.GetStudioAnonSession(), &datasource.LoadOptions{})
	if err != nil {
		return err
	}

	// originalCollectionMetadata, err := metadata.GetCollection("uesio/studio.usage")
	// if err != nil {
	// 	return err
	// }

	dynamicCollectionMetadata, err := connection.GetMetadata().GetCollection("uesio/core.usage")
	if err != nil {
		return err
	}

	//meta.Copy(dynamicCollectionMetadata, originalCollectionMetadata)

	//TO-DO WHY not create the yaml file? so when we load it's already there??
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

	dynamicCollectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "app",
		Namespace:  "uesio/core",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "REFERENCE",
		Label:      "App",
		ReferenceMetadata: &adapt.ReferenceMetadata{
			Collection: "uesio/studio.app",
		},
	})

	dynamicCollectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "site",
		Namespace:  "uesio/core",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "REFERENCE",
		Label:      "Site",
		ReferenceMetadata: &adapt.ReferenceMetadata{
			Collection: "uesio/studio.site",
		},
	})

	// dynamicCollectionMetadata.Name = "usage"
	// dynamicCollectionMetadata.Namespace = "uesio/core"

	// err = datasource.GetMetadataResponse(connection.GetMetadata(), "uesio/core.user", "", session)
	// if err != nil {
	// 	return err
	// }

	// userRefs := adapt.ReferenceRegistry{}

	// userCollectionMetadata, err := metadata.GetCollection("uesio/core.user")
	// if err != nil {
	// 	return err
	// }

	// refReq := userRefs.Get("uesio/core.user")
	// refReq.Metadata = userCollectionMetadata

	err = newOp.Collection.Loop(func(studioItem meta.Item, index string) error {
		// user, err := studioItem.GetField("uesio/studio.user")
		// if err != nil {
		// 	return err
		// }

		// userFieldMetadata, err := dynamicCollectionMetadata.GetField("uesio/core.user")
		// if err != nil {
		// 	return err
		// }

		// userIDString, ok := user.(string)
		// if !ok {
		// 	return nil
		// }

		// refReq.AddID(userIDString, adapt.ReferenceLocator{
		// 	Item:  studioItem,
		// 	Field: userFieldMetadata,
		// })

		coreItem := op.Collection.NewItem()
		op.Collection.AddItem(mapFields(newOp.Fields, studioItem, coreItem))

		return nil
	})
	if err != nil {
		return err
	}

	return nil //adapt.HandleReferences(connection, userRefs, session, true)

}
