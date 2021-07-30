package datasource

import (
	"encoding/json"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
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

// Save function
func Save(requests []SaveRequest, session *sess.Session) error {

	collated := map[string][]adapt.SaveOp{}
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

		//TO-DO Abel:
		// Send inserts & updates instead of the generic changes

		changes, deletes, err := PopulateAndValidate(request, collectionMetadata, session)
		if err != nil {
			return err
		}

		err = RunBeforeInsertBots(changes, collectionMetadata, session)
		if err != nil {
			return err
		}
		err = RunBeforeUpdateBots(changes, collectionMetadata, session)
		if err != nil {
			return err
		}
		err = RunBeforeDeleteBots(deletes, collectionMetadata, session)
		if err != nil {
			return err
		}

		if len(requests[index].Errors) > 0 {
			// Don't return an error here because it's just expect validation errors
			// and Bot errors. However, we don't want to go any further with processing the request.
			return nil
		}

		dsKey := collectionMetadata.DataSource
		batch := collated[dsKey]
		batch = append(batch, adapt.SaveOp{
			CollectionName: request.Collection,
			WireName:       request.Wire,
			Changes:        changes,
			Deletes:        deletes,
			Options:        request.Options,
		})
		collated[dsKey] = batch
	}

	// 3. Get metadata for each datasource and collection
	for dsKey, batch := range collated {

		datasource, err := meta.NewDataSource(dsKey)
		if err != nil {
			return err
		}

		err = bundle.Load(datasource, session)
		if err != nil {
			return err
		}

		// Now figure out which data source adapter to use
		// and make the requests
		// It would be better to make this requests in parallel
		// instead of in series
		adapterType := datasource.Type
		adapter, err := adapt.GetAdapter(adapterType, session)
		if err != nil {
			return err
		}
		credentials, err := adapt.GetCredentials(datasource.Credentials, session)
		if err != nil {
			return err
		}

		cascadeDeletes, err := getCascadeDeletes(batch, metadataResponse.Collections, &metadataResponse, adapter, credentials)
		if err != nil {
			return err
		}

		err = adapter.Save(batch, &metadataResponse, credentials)
		if err != nil {
			return err
		}

		err = performCascadeDeletes(cascadeDeletes, session)
		if err != nil {
			return err
		}

		for _, op := range batch {
			collectionKey := op.CollectionName
			collectionMetadata, err := metadataResponse.GetCollection(collectionKey)
			if err != nil {
				return err
			}

			err = RunAfterInsertBots(&op, collectionMetadata, session)
			if err != nil {
				return err
			}
			err = RunAfterUpdateBots(&op, collectionMetadata, session)
			if err != nil {
				return err
			}
			err = RunAfterDeleteBots(&op, collectionMetadata, session)
			if err != nil {
				return err
			}
		}

	}

	return nil
}
