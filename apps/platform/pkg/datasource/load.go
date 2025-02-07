package datasource

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

type LoadOptions struct {
	Connection wire.Connection
	Metadata   *wire.MetadataCache
}

func getOpMetadata(op *wire.LoadOp, ops []*wire.LoadOp, metadata *wire.MetadataCache, session *sess.Session, connection wire.Connection) error {
	// Attach the collection metadata to the LoadOp so that Load Bots can access it
	op.AttachMetadataCache(metadata)
	// Special processing for View-only wires
	if op.ViewOnly {
		if err := GetMetadataForViewOnlyWire(op, metadata, connection, session); err != nil {
			return err
		}
		return nil
	}

	if !session.GetContextPermissions().HasCollectionReadPermission(op.CollectionName) {
		return exceptions.NewForbiddenException(fmt.Sprintf("Profile %s does not have read access to the %s collection.", session.GetContextProfile(), op.CollectionName))
	}

	return GetMetadataForLoad(op, metadata, ops, session, connection)
}

func addDefaultFieldsAndOrder(op *wire.LoadOp) {
	// Verify that the id field is present
	hasIDField := false
	hasUniqueKeyField := false
	for i := range op.Fields {
		if op.Fields[i].ID == commonfields.Id {
			hasIDField = true
			break
		}
		if op.Fields[i].ID == commonfields.UniqueKey {
			hasUniqueKeyField = true
			break
		}
	}

	if !hasIDField && !op.Aggregate {
		op.Fields = append(op.Fields, wire.LoadRequestField{
			ID: commonfields.Id,
		})
	}

	if !hasUniqueKeyField && !op.Aggregate {
		op.Fields = append(op.Fields, wire.LoadRequestField{
			ID: commonfields.UniqueKey,
		})
	}

	//Set default order by: id - asc
	if op.Order == nil && !op.Aggregate {
		op.Order = append(op.Order, GetDefaultOrder())
	}
}

func Load(ops []*wire.LoadOp, session *sess.Session, options *LoadOptions) (*wire.MetadataCache, error) {
	if options == nil {
		options = &LoadOptions{}
	}
	var opsNeedRecordLevelAccessCheck bool
	var opsToQuery []*wire.LoadOp
	var err error
	metadataResponse := &wire.MetadataCache{}
	// Use existing metadata if it was passed in
	if options.Metadata != nil {
		metadataResponse = options.Metadata
	}

	connection, err := GetConnection(meta.PLATFORM_DATA_SOURCE, session, options.Connection)
	if err != nil {
		return nil, err
	}

	userPerms := session.GetContextPermissions()

	// Loop over the ops and batch per data source
	for _, op := range ops {

		err := getOpMetadata(op, ops, metadataResponse, session, connection)
		if err != nil {
			return nil, err
		}

		addDefaultFieldsAndOrder(op)

		if !op.Query {
			continue
		}

		collectionMetadata, err := metadataResponse.GetCollection(op.CollectionName)
		if err != nil {
			return nil, err
		}
		if opNeedsRecordLevelAccessCheck(op, collectionMetadata, userPerms, session) {
			opsNeedRecordLevelAccessCheck = true
			op.SetNeedsRecordLevelAccessCheck()
		}
		opsToQuery = append(opsToQuery, op)
	}

	if opsNeedRecordLevelAccessCheck {
		// Attach user access tokens to the session
		if err = GenerateUserAccessTokens(connection, metadataResponse, session); err != nil {
			return nil, err
		}
	}

	for _, op := range opsToQuery {
		err := queryOp(op, opsToQuery, metadataResponse, session, connection)
		if err != nil {
			return nil, err
		}
	}

	return metadataResponse, nil
}

func queryOp(op *wire.LoadOp, ops []*wire.LoadOp, metadata *wire.MetadataCache, session *sess.Session, connection wire.Connection) error {
	// In order to prevent Uesio DB, Dynamic Collections, and External Integration load bots from each separately
	// needing to manually filter out inactive conditions, we will instead do that here, as part of processConditions,
	// which will return a list of active Conditions (and this is recursive, so that sub-conditions of GROUP, SUBQUERY,
	// etc. will also only include active condiitons).
	// We will temporarily mutate the load op's conditions so that all load implementations will now have only active
	// conditions, and then we will, at the end of the operation, restore them back.
	// NOTICE that this activeConditions slice is NOT a pointer, it's a value, so it is functionally a clone
	// of the original conditions, which we need to preserve as is so that the client can know what the original state was.
	originalConditions := op.Conditions
	originalQuery := op.Query
	activeConditions, err := processConditions(op, op.CollectionName, originalConditions, metadata, ops, session)
	if err != nil {
		return err
	}

	// The op could have been cancelled in the process conditions step, so we need
	// to check op.Query again.
	if !op.Query {
		op.Query = originalQuery
		return nil
	}

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	if err = addMetadataToCollection(op.Collection, collectionMetadata); err != nil {
		return err
	}

	collectionKey := collectionMetadata.GetFullName()

	integrationName := collectionMetadata.GetIntegrationName()

	usage.RegisterEvent("LOAD", "COLLECTION", collectionKey, 0, session)
	usage.RegisterEvent("LOAD", "DATASOURCE", integrationName, 0, session)

	// Mutate the conditions immediately before handing off to the load implementations
	op.Conditions = activeConditions

	// 3 branches:
	// 1. Dynamic collections
	// 2. External integration collections
	// 3. Native Uesio DB collections
	var loadErr error
	if collectionMetadata.IsDynamic() {
		// Dynamic collection loads
		loadErr = runDynamicCollectionLoadBots(op, connection, session)
	} else if integrationName != "" && integrationName != meta.PLATFORM_DATA_SOURCE {
		// external integration loads
		loadErr = performExternalIntegrationLoad(integrationName, op, connection, session)
	} else {
		// native Uesio DB loads
		loadErr = LoadOp(op, connection, session)
	}
	// Regardless of what happened with the load, restore the original conditions list now that we're done
	op.Conditions = originalConditions

	return loadErr
}

func performExternalIntegrationLoad(integrationName string, op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {
	integrationConnection, err := GetIntegrationConnection(integrationName, session, connection)
	if err != nil {
		return err
	}
	collectionMetadata, err := op.GetCollectionMetadata()
	if err != nil {
		return err
	}
	op.AttachIntegrationConnection(integrationConnection)
	integrationType := integrationConnection.GetIntegrationType()
	// If there's a collection-specific load bot defined, use that,
	// otherwise default to the integration's defined load bot.
	// If there's neither, then there's nothing to do.
	botKey := collectionMetadata.LoadBot
	if botKey == "" && integrationType != nil {
		botKey = integrationType.LoadBot
	}
	if err = runExternalDataSourceLoadBot(botKey, op, connection, session); err != nil {
		return err
	}
	return nil
}

// LoadOp loads one operation within a sequence.
// WARNING!!! This is not a shortcut for Load(ops...)---DO NOT CALL THIS unless you know what you're doing
func LoadOp(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

	if err := connection.Load(op, session); err != nil {
		return err
	}

	if !op.LoadAll || !op.HasMoreBatches {
		return nil
	}

	return LoadOp(op, connection, session)
}
