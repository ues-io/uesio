package systemdialect

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Fake Reference Fields for uesio/core.usage collection
// The other fields are created as real metadata
var USER_FIELD_METADATA = adapt.FieldMetadata{
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
}

var APP_FIELD_METADATA = adapt.FieldMetadata{
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
}

var SITE_FIELD_METADATA = adapt.FieldMetadata{
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
}

// Gets the conditions from the wire and translates them from core to studio
func mapConditions(coreConditions []adapt.LoadRequestCondition) []adapt.LoadRequestCondition {
	var studioConditions []adapt.LoadRequestCondition
	for _, elem := range coreConditions {
		elem.Field = strings.Replace(elem.Field, "uesio/core.", "uesio/studio.", 1)
		studioConditions = append(studioConditions, elem)
	}
	return studioConditions
}

func mapOrder(coreOrder []adapt.LoadRequestOrder) []adapt.LoadRequestOrder {
	var studioOrder []adapt.LoadRequestOrder
	for _, elem := range coreOrder {
		elem.Field = strings.Replace(elem.Field, "uesio/core.", "uesio/studio.", 1)
		studioOrder = append(studioOrder, elem)
	}
	return studioOrder
}

func processRefrence(item meta.Item, fieldID string, refReq *adapt.ReferenceRequest, fieldMetadata adapt.FieldMetadata) error {
	value, err := item.GetField(fieldID)
	if err != nil {
		return err
	}

	valueString, ok := value.(string)
	if !ok {
		return nil
	}

	refReq.AddID(valueString, adapt.ReferenceLocator{
		Item:  item,
		Field: &fieldMetadata,
	})

	return nil
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
		Collection:     &adapt.UsageMappingCollection{},
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
		Order:          mapOrder(op.Order),
		Query:          true,
		BatchSize:      op.BatchSize,
		LoadAll:        op.LoadAll,
		Params:         op.Params,
		HasMoreBatches: op.HasMoreBatches,
		BatchNumber:    op.BatchNumber,
	}

	_, err := datasource.Load([]*adapt.LoadOp{newOp}, sess.GetStudioAnonSession(), &datasource.LoadOptions{})
	if err != nil {
		return err
	}

	//make sure we pase this back to the original OP
	op.BatchNumber = newOp.BatchNumber
	op.HasMoreBatches = newOp.HasMoreBatches

	//Request metadata for site,app,user since they aren't real references
	metadataResponse := &adapt.MetadataCache{}
	collectionsMetadataReq := datasource.MetadataRequest{
		Options: &datasource.MetadataRequestOptions{
			LoadAllFields: true,
		},
	}

	collectionsMetadataReq.AddCollection("uesio/core.user")
	collectionsMetadataReq.AddCollection("uesio/studio.site")
	collectionsMetadataReq.AddCollection("uesio/studio.app")
	err = collectionsMetadataReq.Load(metadataResponse, sess.GetStudioAnonSession(), connection)
	if err != nil {
		return err
	}
	//END

	//we have this one because the usage page has a wire referencing this collection shall we maybe add it to the collectionsMetadataReq
	dynamicCollectionMetadata, err := connection.GetMetadata().GetCollection("uesio/core.usage")
	if err != nil {
		return err
	}

	//This or from the metadataResponse ??
	// userCollectionMetadata, err := connection.GetMetadata().GetCollection("uesio/core.user")
	// if err != nil {
	// 	return err
	// }

	// siteCollectionMetadata, err := connection.GetMetadata().GetCollection("uesio/studio.site")
	// if err != nil {
	// 	return err
	// }

	dynamicCollectionMetadata.SetField(&USER_FIELD_METADATA)
	dynamicCollectionMetadata.SetField(&APP_FIELD_METADATA)
	dynamicCollectionMetadata.SetField(&SITE_FIELD_METADATA)

	referencedCollections := adapt.ReferenceRegistry{}
	userCollectionMetadata, err := metadataResponse.GetCollection("uesio/core.user")
	if err != nil {
		return err
	}

	siteCollectionMetadata, err := metadataResponse.GetCollection("uesio/studio.site")
	if err != nil {
		return err
	}

	appCollectionMetadata, err := metadataResponse.GetCollection("uesio/studio.app")
	if err != nil {
		return err
	}

	userRefReq := referencedCollections.Get("uesio/core.user")
	userRefReq.Metadata = userCollectionMetadata

	siteRefReq := referencedCollections.Get("uesio/studio.site")
	siteRefReq.Metadata = siteCollectionMetadata

	appRefReq := referencedCollections.Get("uesio/studio.app")
	appRefReq.Metadata = appCollectionMetadata

	err = newOp.Collection.Loop(func(item meta.Item, index string) error {

		err := processRefrence(item, "uesio/core.user", userRefReq, USER_FIELD_METADATA)
		if err != nil {
			return err
		}
		err = processRefrence(item, "uesio/core.site", siteRefReq, SITE_FIELD_METADATA)
		if err != nil {
			return err
		}

		err = processRefrence(item, "uesio/core.app", appRefReq, APP_FIELD_METADATA)
		if err != nil {
			return err
		}

		err = op.Collection.AddItem(item)
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return err
	}

	//This is better here or just after requesting the metadata is this right to add the metadata to the connection?
	connection.GetMetadata().AddCollection("uesio/studio.site", siteCollectionMetadata)
	connection.GetMetadata().AddCollection("uesio/studio.app", appCollectionMetadata)

	//get app and site references with the studio session
	err = adapt.HandleReferences(connection, referencedCollections, sess.GetStudioAnonSession(), true)
	if err != nil {
		return err
	}

	//get user refernces with the current site session
	return adapt.HandleReferences(connection, referencedCollections, session, true)

}
