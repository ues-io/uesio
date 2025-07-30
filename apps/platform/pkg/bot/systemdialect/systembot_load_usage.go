package systemdialect

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runUsageLoadBot(ctx context.Context, op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

	siteAdmin := session.GetSiteAdmin()

	if siteAdmin == nil {
		return errors.New("unable to retrieve usage, site admin context is missing")
	}

	usageData := NewNamespaceSwapCollection("uesio/core", "uesio/studio")

	newOp := &wire.LoadOp{
		CollectionName: "uesio/studio.usage",
		WireName:       "loadStudioUsage",
		View:           op.View,
		Collection:     usageData,
		Conditions: append(usageData.MapConditions(op.Conditions), wire.LoadRequestCondition{
			Field:    "site",
			Value:    session.GetContextSite().ID,
			Operator: "EQ",
		}),
		Fields: []wire.LoadRequestField{
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

	studioMetadata, err := datasource.Load(ctx, []*wire.LoadOp{newOp}, sess.GetStudioAnonSession(), &datasource.LoadOptions{})
	if err != nil {
		return err
	}

	if newOp.Errors != nil {
		return (*newOp.Errors)[0]
	}

	//make sure we pass these back to the original OP
	op.BatchNumber = newOp.BatchNumber
	op.HasMoreBatches = newOp.HasMoreBatches

	metadataResponse, err := op.GetMetadata()
	if err != nil {
		return err
	}

	err = usageData.TransferFieldMetadata("uesio/studio.usage", studioMetadata, metadataResponse)
	if err != nil {
		return err
	}

	referencedCollections := wire.ReferenceRegistry{}
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
		userRefReq.AddID(value, wire.ReferenceLocator{
			Item: item,
			Field: &wire.FieldMetadata{
				Namespace: "uesio/core",
				Name:      "user",
			},
		})

	}

	op.Collection = usageData

	//get user references with the current site session
	return datasource.HandleReferences(ctx, connection, referencedCollections, metadataResponse, session, &datasource.ReferenceOptions{
		AllowMissingItems: true,
	})

}
