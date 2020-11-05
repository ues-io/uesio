package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/bots"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Save function
func Save(requests SaveRequestBatch, session *sess.Session) (*SaveResponseBatch, error) {

	site := session.GetSite()

	collated := map[string]SaveRequestBatch{}
	collatedMetadata := map[string]*adapters.MetadataCache{}
	metadataResponse := adapters.MetadataCache{}
	response := SaveResponseBatch{}

	// Loop over the requests and batch per data source
	for _, request := range requests.Wires {

		collectionKey := request.GetCollection()

		// Keep a running tally of all requested collections
		collections := MetadataRequest{}
		collections.AddCollection(collectionKey)

		for _, change := range request.Changes {
			for fieldKey := range change {
				collections.AddField(collectionKey, fieldKey, nil)
			}
		}

		if request.Options != nil && request.Options.Lookups != nil {
			for _, lookup := range request.Options.Lookups {
				var subFields *FieldsMap
				if lookup.MatchField != "" {
					subFields = &FieldsMap{
						lookup.MatchField: FieldsMap{},
					}
				}
				collections.AddField(collectionKey, lookup.RefField, subFields)
			}
		}

		err := collections.Load(&metadataResponse, collatedMetadata, session)
		if err != nil {
			return nil, err
		}

		// Get the datasource from the object name
		collectionMetadata := metadataResponse.Collections[collectionKey]
		dsKey := collectionMetadata.DataSource
		batch := collated[dsKey]
		batch.Wires = append(batch.Wires, request)
		collated[dsKey] = batch

		err = bots.RunBeforeSave(&request, collectionMetadata, session)
		if err != nil {
			return nil, err
		}

	}

	// 3. Get metadata for each datasource and collection
	for dsKey, batch := range collated {

		datasource, err := metadata.NewDataSource(dsKey)
		if err != nil {
			return nil, err
		}

		err = bundles.Load(datasource, session)
		if err != nil {
			return nil, err
		}

		// Now figure out which data source adapter to use
		// and make the requests
		// It would be better to make this requests in parallel
		// instead of in series
		adapterType := datasource.GetAdapterType()
		adapter, err := adapters.GetAdapter(adapterType)
		if err != nil {
			return nil, err
		}
		credentials, err := datasource.GetCredentials(site)
		if err != nil {
			return nil, err
		}
		adapterResponses, err := adapter.Save(batch.Wires, collatedMetadata[dsKey], credentials)
		if err != nil {
			return nil, err
		}

		err = cleanUpFiles(batch.Wires, session)
		if err != nil {
			return nil, err
		}

		for _, r := range adapterResponses {
			response.Wires = append(response.Wires, r)
		}

	}

	return &response, nil
}

func cleanUpFiles(wires []reqs.SaveRequest, session *sess.Session) error {
	// Get mapping of Collection id -> record id -> true
	idsToDeleteFilesFor := map[string]map[string]bool{}
	for _, saveReq := range wires {
		for _, deletion := range saveReq.Deletes {
			for _, primaryKeyValue := range deletion {
				pkString := primaryKeyValue.(string)
				currentCollectionIds, ok := idsToDeleteFilesFor[saveReq.Collection]
				if !ok {
					currentCollectionIds = map[string]bool{}
					idsToDeleteFilesFor[saveReq.Collection] = currentCollectionIds
				}
				currentCollectionIds[pkString] = true
			}
		}
	}
	return DeleteUserFiles(idsToDeleteFilesFor, session)
}
