package datasource

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/datasource/fieldvalidations"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

type SaveRequestBatch struct {
	Wires []SaveRequest `json:"wires"`
}

type SaveRequest struct {
	Collection string                      `json:"collection"`
	Wire       string                      `json:"wire"`
	Changes    meta.Group                  `json:"changes"`
	Deletes    meta.Group                  `json:"deletes"`
	Errors     []*exceptions.SaveException `json:"errors"`
	Options    *wire.SaveOptions           `json:"options"`
	Params     map[string]any              `json:"params"`
}

func (sr *SaveRequest) UnmarshalJSON(b []byte) error {
	type alias SaveRequest
	sr.Changes = &wire.CollectionMap{}
	sr.Deletes = &wire.CollectionMap{}
	return json.Unmarshal(b, (*alias)(sr))
}

type SaveOptions struct {
	Connection wire.Connection
	Metadata   *wire.MetadataCache
}

func Save(ctx context.Context, requests []SaveRequest, session *sess.Session) error {
	return SaveWithOptions(ctx, requests, session, nil)
}

func SaveWithOptions(ctx context.Context, requests []SaveRequest, session *sess.Session, options *SaveOptions) error {
	if options == nil {
		options = &SaveOptions{}
	}
	allOps := []*wire.SaveOp{}
	metadataResponse := &wire.MetadataCache{}
	// Use existing metadata if it was passed in
	if options.Metadata != nil {
		metadataResponse = options.Metadata
	}

	connection, err := GetConnection(ctx, meta.PLATFORM_DATA_SOURCE, session, options.Connection)
	if err != nil {
		return err
	}

	// Get an admin session to use for fetching metadata only
	adminSession := GetSiteAdminSession(session)

	// Loop over the requests and batch per data source
	for index := range requests {

		request := &requests[index]

		collectionKey := request.Collection

		err := GetFullMetadataForCollection(ctx, metadataResponse, collectionKey, adminSession, connection)
		if err != nil {
			return err
		}

		// Get the datasource from the object name
		collectionMetadata, err := metadataResponse.GetCollection(collectionKey)
		if err != nil {
			return err
		}

		if err = addMetadataToCollection(request.Changes, collectionMetadata); err != nil {
			return err
		}

		if err = addMetadataToCollection(request.Deletes, collectionMetadata); err != nil {
			return err
		}

		// Split changes into inserts, updates, and deletes
		ops, err := splitSave(request, collectionMetadata)
		if err != nil {
			return err
		}

		allOps = append(allOps, ops...)
	}

	hasExistingConnection := options.Connection != nil

	if !hasExistingConnection {
		return WithTransaction(ctx, session, connection, func(conn wire.Connection) error {
			return SaveOps(ctx, allOps, metadataResponse, conn, session)
		})
	}
	return SaveOps(ctx, allOps, metadataResponse, connection, session)
}

func HandleErrorAndAddToSaveOp(op *wire.SaveOp, err error) *exceptions.SaveException {
	saveError := wire.NewGenericSaveException(err)
	op.AddError(saveError)
	return saveError
}

func isExternalIntegrationCollection(op *wire.SaveOp) bool {
	collectionMetadata, err := op.GetCollectionMetadata()
	if err != nil {
		return false
	}
	integrationName := collectionMetadata.GetIntegrationName()
	return integrationName != "" && integrationName != meta.PLATFORM_DATA_SOURCE
}

func SaveOp(ctx context.Context, op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	collectionKey := op.CollectionName
	collectionMetadata, err := op.GetCollectionMetadata()
	if err != nil {
		return err
	}
	integrationName := collectionMetadata.GetIntegrationName()
	isExternalIntegrationSave := isExternalIntegrationCollection(op)

	permissions := session.GetContextPermissions()

	if !isExternalIntegrationSave {
		// TODO Maybe do this for external integration saves at some point
		err = FetchReferences(ctx, connection, op, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}

		err = HandleUpsertLookup(ctx, connection, op, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}
	}

	if len(op.Inserts) > 0 && !permissions.HasCreatePermission(collectionKey) {
		return exceptions.NewForbiddenException(fmt.Sprintf("Profile %s does not have create access to the %s collection.", session.GetContextProfile(), collectionKey))
	}

	if len(op.Updates) > 0 && !permissions.HasEditPermission(collectionKey) {
		return exceptions.NewForbiddenException(fmt.Sprintf("Profile %s does not have edit access to the %s collection.", session.GetContextProfile(), collectionKey))
	}

	if len(op.Deletes) > 0 && !permissions.HasDeletePermission(collectionKey) {
		return exceptions.NewForbiddenException(fmt.Sprintf("Profile %s does not have delete access to the %s collection.", session.GetContextProfile(), collectionKey))
	}

	if !isExternalIntegrationSave {
		err = HandleOldValuesLookup(ctx, connection, op, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}
	}

	err = Populate(op, connection, session)
	if err != nil {
		return HandleErrorAndAddToSaveOp(op, err)
	}

	// NOTE: for actual errors with the population function,
	// Populate desn't return an error, but it does add the errors
	// to the op. We check for those errors here.
	if op.HasErrors() {
		return wire.NewGenericSaveException(fmt.Errorf("error with field population: %s", strings.Join(op.GetErrorStrings(), ", ")))
	}

	err = runBeforeSaveBots(ctx, op, connection, session)
	if err != nil {
		return HandleErrorAndAddToSaveOp(op, err)
	}

	// Check for before save errors here
	if op.HasErrors() {
		return (*op.Errors)[0]
	}

	// Fetch References again.
	if !isExternalIntegrationSave {
		err = FetchReferences(ctx, connection, op, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}
	}

	// Set the unique keys for the last time
	err = op.LoopChanges(func(change *wire.ChangeItem) error {
		return SetUniqueKey(change)
	})
	if err != nil {
		return HandleErrorAndAddToSaveOp(op, err)
	}

	err = fieldvalidations.Validate(op)
	if err != nil {
		return HandleErrorAndAddToSaveOp(op, err)
	}

	// Check for validate errors here
	if op.HasErrors() {
		// if we're ignoring validation errors, and all the errors are validation errors,
		if op.Options != nil && op.Options.IgnoreValidationErrors {
			unSkippedErrors := []*exceptions.SaveException{}
			for _, err := range *op.Errors {

				recordID := err.RecordID
				foundRecord := false
				for _, insert := range op.Inserts {
					if insert.RecordKey == recordID {
						insert.IsNew = false
						op.InsertCount = op.InsertCount - 1
						foundRecord = true
						continue
					}
				}
				if !foundRecord {
					unSkippedErrors = append(unSkippedErrors, err)
				}
			}
			if len(unSkippedErrors) > 0 {
				return unSkippedErrors[0]
			} else {
				op.Errors = &unSkippedErrors
			}
		} else {
			return (*op.Errors)[0]
		}
	}

	usage.RegisterEvent("SAVE", "COLLECTION", collectionKey, 0, session)
	usage.RegisterEvent("SAVE", "DATASOURCE", integrationName, 0, session)

	if !isExternalIntegrationSave {
		err = GenerateRecordChallengeTokens(ctx, op, connection, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}
	}

	err = performCascadeDeletes(ctx, op, connection, session)
	if err != nil {
		return HandleErrorAndAddToSaveOp(op, err)
	}

	// Handle external data integration saves
	if isExternalIntegrationSave {
		err = performExternalIntegrationSave(ctx, integrationName, op, connection, session)
	} else {
		// handle Uesio DB saves
		err = connection.Save(ctx, op, session)
	}
	if err != nil {
		return HandleErrorAndAddToSaveOp(op, err)
	}

	if !isExternalIntegrationCollection(op) {
		if err = connection.SetRecordAccessTokens(ctx, op, session); err != nil {
			return err
		}
	}

	err = runAfterSaveBots(ctx, op, connection, session)
	if err != nil {
		return HandleErrorAndAddToSaveOp(op, err)
	}
	// Check for after save errors here
	if op.HasErrors() {
		return (*op.Errors)[0]
	}

	return nil
}

func performExternalIntegrationSave(ctx context.Context, integrationName string, op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	integrationConnection, err := GetIntegrationConnection(ctx, integrationName, session, connection)
	if err != nil {
		return err
	}
	collectionMetadata, err := op.GetCollectionMetadata()
	if err != nil {
		return err
	}
	op.AttachIntegrationConnection(integrationConnection)
	integrationType := integrationConnection.GetIntegrationType()
	// If there's a collection-specific save bot defined, use that,
	// otherwise default to the integration's defined save bot.
	// If there's neither, then there's nothing to do.
	botKey := collectionMetadata.SaveBot
	if botKey == "" && integrationType != nil {
		botKey = integrationType.SaveBot
	}
	if err = runExternalDataSourceSaveBot(ctx, botKey, op, connection, session); err != nil {
		return err
	}
	return nil
}

func SaveOps(ctx context.Context, batch []*wire.SaveOp, metadata *wire.MetadataCache, connection wire.Connection, session *sess.Session) error {

	// Get all the user access tokens that we'll need for this request
	// TODO:
	// Finally check for record level permissions and ability to do the save.
	err := GenerateUserAccessTokens(ctx, connection, metadata, session)
	if err != nil {
		return err
	}

	for _, op := range batch {

		op.AttachMetadataCache(metadata)

		collectionMetadata, err := op.GetCollectionMetadata()
		if err != nil {
			return err
		}

		if collectionMetadata.IsDynamic() {
			err2 := runDynamicCollectionSaveBots(ctx, op, connection, session)
			if err2 != nil {
				// If this error is already in the save op, don't add it again
				if exceptions.IsType[*exceptions.SaveException](err2) {
					return err2
				} else {
					return HandleErrorAndAddToSaveOp(op, err2)
				}
			}
			continue
		}

		err = SaveOp(ctx, op, connection, session)
		if err != nil {
			return err
		}

	}

	return nil
}
