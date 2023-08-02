package datasource

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

type SaveRequestBatch struct {
	Wires []SaveRequest `json:"wires"`
}

type SaveRequest struct {
	Collection string                       `json:"collection"`
	Wire       string                       `json:"wire"`
	Changes    meta.Group                   `json:"changes"`
	Deletes    meta.Group                   `json:"deletes"`
	Errors     []adapt.SaveError            `json:"errors"`
	Options    *adapt.SaveOptions           `json:"options"`
	Conditions []adapt.LoadRequestCondition `json:"conditions"`
	Params     map[string]string            `json:"params"`
}

type SaveRequestImpl struct {
	Collection string                       `json:"collection"`
	Wire       string                       `json:"wire"`
	Changes    *adapt.CollectionMap         `json:"changes"`
	Deletes    *adapt.CollectionMap         `json:"deletes"`
	Errors     []adapt.SaveError            `json:"errors"`
	Options    *adapt.SaveOptions           `json:"options"`
	Conditions []adapt.LoadRequestCondition `json:"conditions"`
	Params     map[string]string            `json:"params"`
}

func (sr *SaveRequest) UnmarshalJSON(b []byte) error {

	data := SaveRequestImpl{}
	err := json.Unmarshal(b, &data)
	if err != nil {
		return err
	}
	sr.Collection = data.Collection
	sr.Wire = data.Wire
	sr.Changes = data.Changes
	sr.Deletes = data.Deletes
	sr.Errors = data.Errors
	sr.Options = data.Options
	sr.Conditions = data.Conditions
	sr.Params = data.Params
	return nil
}

type SaveOptions struct {
	Connection adapt.Connection
	Metadata   *adapt.MetadataCache
}

func Save(requests []SaveRequest, session *sess.Session) error {
	return SaveWithOptions(requests, session, nil)
}

func SaveWithOptions(requests []SaveRequest, session *sess.Session, options *SaveOptions) error {
	if options == nil {
		options = &SaveOptions{}
	}
	allOps := []*adapt.SaveOp{}
	metadataResponse := &adapt.MetadataCache{}
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

	err = SaveOp(allOps, connection, session)
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

func HandleErrorAndAddToSaveOp(op *adapt.SaveOp, err error) *adapt.SaveError {
	saveError := adapt.NewGenericSaveError(err)
	op.AddError(saveError)
	return saveError
}

func SaveOp(batch []*adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	dsKey := meta.PLATFORM_DATA_SOURCE
	// Get all the user access tokens that we'll need for this request
	// TODO:
	// Finally check for record level permissions and ability to do the save.
	err := GenerateUserAccessTokens(connection, session)
	if err != nil {
		return err
	}

	for _, op := range batch {

		collectionKey := op.Metadata.GetFullName()

		err := processConditions(collectionKey, op.Conditions, op.Params, connection.GetMetadata(), nil, session)
		if err != nil {
			return err
		}

		if op.Metadata.Type == "DYNAMIC" {
			err := runDynamicCollectionSaveBots(op, connection, session)
			if err != nil {
				return HandleErrorAndAddToSaveOp(op, err)
			}
			continue
		}

		permissions := session.GetContextPermissions()

		err = adapt.FetchReferences(connection, op, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}

		err = adapt.HandleUpsertLookup(connection, op, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}

		if len(op.Inserts) > 0 {
			if !permissions.HasCreatePermission(collectionKey) {
				return fmt.Errorf("Profile %s does not have create access to the %s collection.", session.GetProfile(), collectionKey)
			}
		}

		if len(op.Updates) > 0 {
			if !permissions.HasEditPermission(collectionKey) {
				return fmt.Errorf("Profile %s does not have edit access to the %s collection.", session.GetProfile(), collectionKey)
			}
		}

		if len(op.Deletes) > 0 {
			if !permissions.HasDeletePermission(collectionKey) {
				return fmt.Errorf("Profile %s does not have delete access to the %s collection.", session.GetProfile(), collectionKey)
			}
		}

		err = adapt.HandleOldValuesLookup(connection, op, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}

		err = Populate(op, connection, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}

		// Check for population errors here
		if op.HasErrors() {
			return adapt.NewGenericSaveError(errors.New("Error with field population"))
		}

		err = runBeforeSaveBots(op, connection, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}

		// Check for before save errors here
		if op.HasErrors() {
			return adapt.NewGenericSaveError(errors.New("Error with before save bots"))
		}

		// Fetch References again.
		err = adapt.FetchReferences(connection, op, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}

		// Set the unique keys for the last time
		err = op.LoopChanges(func(change *adapt.ChangeItem) error {
			return adapt.SetUniqueKey(change)
		})
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}

		err = Validate(op, connection, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}

		// Check for validate errors here
		if op.HasErrors() {
			return adapt.NewGenericSaveError(errors.New("Error with validation"))
		}

		err = GenerateRecordChallengeTokens(op, connection, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}

		err = performCascadeDeletes(op, connection, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}

		err = connection.Save(op, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}

		err = runAfterSaveBots(op, connection, session)
		if err != nil {
			return HandleErrorAndAddToSaveOp(op, err)
		}

		// Check for after save errors here
		if op.HasErrors() {
			return adapt.NewGenericSaveError(errors.New("Error with after save bots"))
		}
		usage.RegisterEvent("SAVE", "COLLECTION", op.Metadata.GetFullName(), 0, session)
		usage.RegisterEvent("SAVE", "DATASOURCE", dsKey, 0, session)
	}

	return nil
}
