package datasource

import (
	"encoding/json"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

type SaveRequestBatch struct {
	Wires []SaveRequest `json:"wires"`
}

type SaveRequest struct {
	Collection string             `json:"collection"`
	Wire       string             `json:"wire"`
	Changes    meta.Group         `json:"changes"`
	Deletes    meta.Group         `json:"deletes"`
	Errors     []adapt.SaveError  `json:"errors"`
	Options    *adapt.SaveOptions `json:"options"`
}

func (sr *SaveRequest) UnmarshalJSON(b []byte) error {
	data := make(map[string]json.RawMessage)
	err := json.Unmarshal(b, &data)
	if err != nil {
		return err
	}
	for k, v := range data {
		switch k {
		case "collection":
			s := ""
			err := json.Unmarshal(v, &s)
			if err != nil {
				return err
			}
			sr.Collection = s
		case "wire":
			s := ""
			err := json.Unmarshal(v, &s)
			if err != nil {
				return err
			}
			sr.Wire = s
		case "changes":
			c := adapt.CollectionMap{}
			err := json.Unmarshal(v, &c)
			if err != nil {
				return err
			}
			sr.Changes = &c
		case "deletes":
			d := adapt.CollectionMap{}
			err := json.Unmarshal(v, &d)
			if err != nil {
				return err
			}
			sr.Deletes = &d
		case "options":
			o := adapt.SaveOptions{}
			err := json.Unmarshal(v, &o)
			if err != nil {
				return err
			}
			sr.Options = &o
		}

	}

	return nil
}

type SaveOptions struct {
	Connections map[string]adapt.Connection
	Metadata    *adapt.MetadataCache
}

func Save(requests []SaveRequest, session *sess.Session) error {
	return SaveWithOptions(requests, session, nil)
}

func SaveWithOptions(requests []SaveRequest, session *sess.Session, options *SaveOptions) error {
	if options == nil {
		options = &SaveOptions{}
	}
	collated := map[string][]*adapt.SaveOp{}
	metadataResponse := &adapt.MetadataCache{}
	// Use existing metadata if it was passed in
	if options.Metadata != nil {
		metadataResponse = options.Metadata
	}

	// Loop over the requests and batch per data source
	for index := range requests {

		request := &requests[index]

		collectionKey := request.Collection

		// Keep a running tally of all requested collections
		collections := MetadataRequest{
			Options: &MetadataRequestOptions{
				LoadAllFields: true,
			},
		}
		err := collections.AddCollection(collectionKey)
		if err != nil {
			return err
		}

		err = collections.Load(metadataResponse, session, nil)
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

		dsKey := collectionMetadata.DataSource
		batch := collated[dsKey]
		batch = append(batch, ops...)
		collated[dsKey] = batch
	}

	// Get all the user access tokens that we'll need for this request
	// TODO:
	// Finally check for record level permissions and ability to do the save.
	err := GenerateUserAccessTokens(metadataResponse, &LoadOptions{
		Metadata:    metadataResponse,
		Connections: options.Connections,
	}, session)
	if err != nil {
		return err
	}

	// 3. Get metadata for each datasource and collection
	for dsKey, batch := range collated {

		connection, err := GetConnection(dsKey, metadataResponse, session, options.Connections)
		if err != nil {
			return err
		}

		if !HasExistingConnection(dsKey, options.Connections) {
			err := connection.BeginTransaction()
			if err != nil {
				return err
			}
		}

		err = applyBatches(dsKey, batch, connection, session)
		if err != nil {
			if !HasExistingConnection(dsKey, options.Connections) {
				err := connection.RollbackTransaction()
				if err != nil {
					return err
				}
			}
			return err
		}

		if !HasExistingConnection(dsKey, options.Connections) {
			err := connection.CommitTransaction()
			if err != nil {
				return err
			}
		}

	}

	return nil
}

func applyBatches(dsKey string, batch []*adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	for _, op := range batch {

		// Set Unique Keys For Inserts
		err := op.LoopInserts(func(change *adapt.ChangeItem) error {
			// It's ok to fail here creating unique keys
			// We'll try again later after we've run some bots
			_ = adapt.SetUniqueKey(change)
			return nil
		})
		if err != nil {
			op.AddError(adapt.NewGenericSaveError(err))
			return err
		}

		err = adapt.FetchReferences(connection, op, session)
		if err != nil {
			op.AddError(adapt.NewGenericSaveError(err))
			return err
		}

		err = adapt.HandleUpsertLookup(connection, op, session)
		if err != nil {
			op.AddError(adapt.NewGenericSaveError(err))
			return err
		}

		err = adapt.HandleOldValuesLookup(connection, op, session)
		if err != nil {
			op.AddError(adapt.NewGenericSaveError(err))
			return err
		}

		err = Populate(op, connection, session)
		if err != nil {
			op.AddError(adapt.NewGenericSaveError(err))
			return err
		}

		// Check for population errors here
		if op.HasErrors() {
			return adapt.NewGenericSaveError(errors.New("Error with field population"))
		}

		err = runBeforeSaveBots(op, connection, session)
		if err != nil {
			op.AddError(adapt.NewGenericSaveError(err))
			return err
		}

		// Check for before save errors here
		if op.HasErrors() {
			return adapt.NewGenericSaveError(errors.New("Error with before save bots"))
		}

		// Fetch References again.
		err = adapt.FetchReferences(connection, op, session)
		if err != nil {
			op.AddError(adapt.NewGenericSaveError(err))
			return err
		}

		err = Validate(op, connection, session)
		if err != nil {
			op.AddError(adapt.NewGenericSaveError(err))
			return err
		}

		// Check for validate errors here
		if op.HasErrors() {
			return adapt.NewGenericSaveError(errors.New("Error with validation"))
		}

		// Set the unique keys for the last time
		err = op.LoopChanges(func(change *adapt.ChangeItem) error {
			return adapt.SetUniqueKey(change)
		})
		if err != nil {
			op.AddError(adapt.NewGenericSaveError(err))
			return err
		}

		err = GenerateRecordChallengeTokens(op, connection, session)
		if err != nil {
			op.AddError(adapt.NewGenericSaveError(err))
			return err
		}

		err = performCascadeDeletes(op, connection, session)
		if err != nil {
			op.AddError(adapt.NewGenericSaveError(err))
			return err
		}

		err = connection.Save(op, session)
		if err != nil {
			op.AddError(adapt.NewGenericSaveError(err))
			return err
		}

		err = runAfterSaveBots(op, connection, session)
		if err != nil {
			op.AddError(adapt.NewGenericSaveError(err))
			return err
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
