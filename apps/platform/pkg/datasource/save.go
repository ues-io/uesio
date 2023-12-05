package datasource

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
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
	Collection string            `json:"collection"`
	Wire       string            `json:"wire"`
	Changes    meta.Group        `json:"changes"`
	Deletes    meta.Group        `json:"deletes"`
	Errors     []wire.SaveError  `json:"errors"`
	Options    *wire.SaveOptions `json:"options"`
	Params     map[string]string `json:"params"`
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

func Save(requests []SaveRequest, session *sess.Session) error {
	return SaveWithOptions(requests, session, nil)
}

func SaveWithOptions(requests []SaveRequest, session *sess.Session, options *SaveOptions) error {
	if options == nil {
		options = &SaveOptions{}
	}
	allOps := []*wire.SaveOp{}
	metadataResponse := &wire.MetadataCache{}
	// Use existing metadata if it was passed in
	if options.Metadata != nil {
		metadataResponse = options.Metadata
	}

	// Get an admin session to use for fetching metadata only
	adminSession := GetSiteAdminSession(session)

	// Loop over the requests and batch per data source
	for index := range requests {

		request := &requests[index]

		collectionKey := request.Collection

		err := GetFullMetadataForCollection(metadataResponse, collectionKey, adminSession)
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
		ops, err := splitSave(request, collectionMetadata, session)
		if err != nil {
			return err
		}

		allOps = append(allOps, ops...)
	}

	hasExistingConnection := options.Connection != nil

	// 3. Get metadata for each datasource and collection

	connection, err := GetConnection(meta.PLATFORM_DATA_SOURCE, metadataResponse, session, options.Connection)
	if err != nil {
		return err
	}

	if !hasExistingConnection {
		err := connection.BeginTransaction()
		if err != nil {
			return err
		}
	}

	err = SaveOps(allOps, connection, session)
	if err != nil {
		if !hasExistingConnection {
			err := connection.RollbackTransaction()
			if err != nil {
				// We actually don't care about this error.
				// The error here usually means that the save never went through
				// in the first place, so we can't roll it back.
			}
		}
		return err
	}

	if !hasExistingConnection {
		err := connection.CommitTransaction()
		if err != nil {
			return err
		}
	}

	return nil
}

func HandleErrorAndAddToSaveOp(op *wire.SaveOp, err error) *wire.SaveError {
	saveError := wire.NewGenericSaveError(err)
	op.AddError(saveError)
	return saveError
}

func isExternalIntegrationCollection(op *wire.SaveOp) bool {
	integrationName := op.Metadata.GetIntegrationName()
	return integrationName != "" && integrationName != meta.PLATFORM_DATA_SOURCE
}

func SaveOp(op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	collectionKey := op.Metadata.GetFullName()
	integrationName := op.Metadata.GetIntegrationName()
	isExternalIntegrationSave := isExternalIntegrationCollection(op)

	permissions := session.GetContextPermissions()

	err := adapt.FetchReferences(connection, op, session)
	if err != nil {
		return HandleErrorAndAddToSaveOp(op, err)
	}

	if !isExternalIntegrationSave {
		err = adapt.HandleUpsertLookup(connection, op, session)
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
		err = adapt.HandleOldValuesLookup(connection, op, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}
	}

	err = Populate(op, connection, session)
	if err != nil {
		return HandleErrorAndAddToSaveOp(op, err)
	}

	// Check for population errors here
	if op.HasErrors() {
		return wire.NewGenericSaveError(errors.New("Error with field population"))
	}

	err = runBeforeSaveBots(op, connection, session)
	if err != nil {
		return HandleErrorAndAddToSaveOp(op, err)
	}

	// Check for before save errors here
	if op.HasErrors() {
		return &(*op.Errors)[0]
	}

	// Fetch References again.
	err = adapt.FetchReferences(connection, op, session)
	if err != nil {
		return HandleErrorAndAddToSaveOp(op, err)
	}

	// Set the unique keys for the last time
	err = op.LoopChanges(func(change *wire.ChangeItem) error {
		return adapt.SetUniqueKey(change)
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
		return &(*op.Errors)[0]
	}

	usage.RegisterEvent("SAVE", "COLLECTION", collectionKey, 0, session)
	usage.RegisterEvent("SAVE", "DATASOURCE", integrationName, 0, session)

	if !isExternalIntegrationSave {
		err = GenerateRecordChallengeTokens(op, connection, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}
	}

	err = performCascadeDeletes(op, connection, session)
	if err != nil {
		return HandleErrorAndAddToSaveOp(op, err)
	}

	// Handle external data integration saves
	if isExternalIntegrationSave {
		err = performExternalIntegrationSave(integrationName, op, connection, session)
	} else {
		// handle Uesio DB saves
		err = connection.Save(op, session)
	}
	if err != nil {
		return HandleErrorAndAddToSaveOp(op, err)
	}

	err = runAfterSaveBots(op, connection, session)
	if err != nil {
		return HandleErrorAndAddToSaveOp(op, err)
	}
	// Check for after save errors here
	if op.HasErrors() {
		return &(*op.Errors)[0]
	}

	return nil
}

func performExternalIntegrationSave(integrationName string, op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	integrationConnection, err := GetIntegrationConnection(integrationName, session, connection)
	if err != nil {
		return err
	}
	op.AttachIntegrationConnection(integrationConnection)
	integrationType := integrationConnection.GetIntegrationType()
	// If there's a collection-specific save bot defined, use that,
	// otherwise default to the integration's defined save bot.
	// If there's neither, then there's nothing to do.
	botKey := op.Metadata.SaveBot
	if botKey == "" && integrationType != nil {
		botKey = integrationType.SaveBot
	}
	if err = runExternalDataSourceSaveBot(botKey, op, connection, session); err != nil {
		return err
	}
	return nil
}

func SaveOps(batch []*wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	// Get all the user access tokens that we'll need for this request
	// TODO:
	// Finally check for record level permissions and ability to do the save.
	err := GenerateUserAccessTokens(connection, session)
	if err != nil {
		return err
	}

	for _, op := range batch {

		if op.Metadata.IsDynamic() {
			err2 := runDynamicCollectionSaveBots(op, connection, session)
			if err2 != nil {
				// If this error is already in the save op, don't add it again
				if _, isGenericSaveError := err2.(*wire.SaveError); isGenericSaveError {
					return err2
				} else {
					return HandleErrorAndAddToSaveOp(op, err2)
				}
			}
			continue
		}

		err = SaveOp(op, connection, session)
		if err != nil {
			return err
		}

	}

	for _, op := range batch {
		if !isExternalIntegrationCollection(op) {
			if err = connection.SetRecordAccessTokens(op, session); err != nil {
				return err
			}
		}
	}

	return nil
}
