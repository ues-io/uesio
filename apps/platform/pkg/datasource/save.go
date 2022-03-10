package datasource

import (
	"encoding/json"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type SaveError struct {
	RecordID interface{} `json:"recordid"`
	FieldID  string      `json:"fieldid"`
	Message  string      `json:"message"`
}

func (se *SaveError) Error() string {
	return se.Message
}

func NewSaveError(recordID interface{}, fieldID, message string) *SaveError {
	return &SaveError{
		RecordID: recordID,
		FieldID:  fieldID,
		Message:  message,
	}
}

// SaveRequest struct
type SaveRequest struct {
	Collection         string             `json:"collection"`
	Wire               string             `json:"wire"`
	Changes            loadable.Group     `json:"changes"`
	Deletes            loadable.Group     `json:"deletes"`
	Errors             []SaveError        `json:"errors"`
	Options            *adapt.SaveOptions `json:"-"`
	UserResponseTokens *adapt.SaveOptions `json:"-"`
}

func (sr *SaveRequest) AddError(err *SaveError) {
	if sr.Errors == nil {
		sr.Errors = []SaveError{}
	}
	sr.Errors = append(sr.Errors, *err)
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
		}
	}

	return nil
}

type SaveOptions struct {
	Connections map[string]adapt.Connection
}

// Save function
func Save(requests []SaveRequest, session *sess.Session) error {
	return SaveWithOptions(requests, session, nil)
}

func SaveWithOptions(requests []SaveRequest, session *sess.Session, options *SaveOptions) error {
	if options == nil {
		options = &SaveOptions{}
	}
	collated := map[string][]*adapt.SaveOp{}
	metadataResponse := adapt.MetadataCache{}

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

		if request.Options != nil && request.Options.Lookups != nil {
			for _, lookup := range request.Options.Lookups {
				var subFields *FieldsMap
				if lookup.MatchField != "" {
					subFields = &FieldsMap{
						lookup.MatchField: FieldsMap{},
					}
				}
				err := collections.AddField(collectionKey, lookup.RefField, subFields)
				if err != nil {
					return err
				}
			}
		}

		err = collections.Load(&metadataResponse, session)
		if err != nil {
			return err
		}

		// Get the datasource from the object name
		collectionMetadata, err := metadataResponse.GetCollection(collectionKey)
		if err != nil {
			return err
		}

		// Split changes into inserts, updates, and deletes
		ops, err := SplitSave(request, collectionMetadata, session)
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
	err := GenerateUserAccessTokens(&metadataResponse, session)
	if err != nil {
		return err
	}

	// 3. Get metadata for each datasource and collection
	for dsKey, batch := range collated {

		connection, err := GetConnection(dsKey, session.GetTokens(), &metadataResponse, session, options.Connections)
		if err != nil {
			return err
		}

		if !HasExistingConnection(dsKey, options.Connections) {
			err := connection.BeginTransaction()
			if err != nil {
				return err
			}
		}

		err = applyBatches(batch, connection, session)
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

func applyBatches(batch []*adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	metadata := connection.GetMetadata()
	for _, op := range batch {

		collectionMetadata, err := metadata.GetCollection(op.CollectionName)
		if err != nil {
			return err
		}

		// Do Upsert Lookups Here First
		err = adapt.HandleUpsertLookup(connection, op)
		if err != nil {
			return err
		}

		err = adapt.HandleOldValuesLookup(connection, op)
		if err != nil {
			return err
		}

		autonumber, err := getAutonumber(len(*op.Inserts), connection, collectionMetadata)
		if err != nil {
			return err
		}

		err = Populate(op, collectionMetadata, autonumber, session)
		if err != nil {
			return err
		}

		err = runBeforeSaveBots(op, collectionMetadata, connection, session)
		if err != nil {
			return err
		}

		// Now do Reference Lookups and Reference Integrity Lookups
		err = adapt.HandleReferenceLookups(connection, op)
		if err != nil {
			return err
		}

		err = Validate(op, collectionMetadata, connection, session)
		if err != nil {
			return err
		}

		err = GenerateRecordChallengeTokens(op, collectionMetadata, session)
		if err != nil {
			return err
		}

		err = connection.Save(op)
		if err != nil {
			return err
		}

		err = performCascadeDeletes(op, connection, session)
		if err != nil {
			return err
		}

		err = runAfterSaveBots(op, collectionMetadata, connection, session)
		if err != nil {
			return err
		}
	}

	return nil
}
