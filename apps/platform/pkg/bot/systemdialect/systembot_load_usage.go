package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runUsageLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	siteAdmin := session.GetSiteAdmin()

	if siteAdmin == nil {
		return errors.New("unable to retrieve usage, site admin context is missing")
	}

	usageData := NewNamespaceSwapCollection("uesio/studio", "uesio/core")

	newOp := &adapt.LoadOp{
		CollectionName: "uesio/studio.usage",
		WireName:       "loadStudioUsage",
		View:           op.View,
		Collection:     usageData,
		Conditions: append(usageData.MapConditions(op.Conditions), adapt.LoadRequestCondition{
			Field:    "site",
			Value:    session.GetContextSite().ID,
			Operator: "EQ",
		}),
		Fields: []adapt.LoadRequestField{
			{ID: "actiontype"},
			{ID: "app"},
			{ID: "day"},
			{ID: "metadataname"},
			{ID: "metadatatype"},
			{ID: "site"},
			{ID: "total"},
			{ID: "user"},
		},
		Order:          usageData.MapOrder(op.Order),
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

	metadataResponse := connection.GetMetadata()

	collectionMetadata, err := metadataResponse.GetCollection("uesio/core.usage")
	if err != nil {
		return err
	}

	userFieldMetadata, err := collectionMetadata.GetField("uesio/core.user")
	if err != nil {
		return err
	}

	referencedCollections := adapt.ReferenceRegistry{}
	userCollectionMetadata, err := metadataResponse.GetCollection("uesio/core.user")
	if err != nil {
		return err
	}

	userRefReq := referencedCollections.Get("uesio/core.user")
	userRefReq.Metadata = userCollectionMetadata

	for _, item := range usageData.collection {
		value, err := item.GetFieldAsString("uesio/core.user")
		if err != nil {
			return err
		}

		userRefReq.AddID(value, adapt.ReferenceLocator{
			Item:  item,
			Field: userFieldMetadata,
		})

	}

	op.Collection = usageData

	//get user references with the current site session
	return adapt.HandleReferences(connection, referencedCollections, session, true)

}
