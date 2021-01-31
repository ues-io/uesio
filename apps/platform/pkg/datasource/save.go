package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Save function
func Save(requests SaveRequestBatch, session *sess.Session) (*SaveResponseBatch, error) {

	site := session.GetSite()

	collated := map[string]SaveRequestBatch{}
	metadataResponse := adapt.MetadataCache{}
	response := SaveResponseBatch{}

	// Loop over the requests and batch per data source
	for _, request := range requests.Wires {

		collectionKey := request.GetCollection()

		// Keep a running tally of all requested collections
		collections := MetadataRequest{
			Options: &MetadataRequestOptions{
				LoadAllFields: true,
			},
		}
		err := collections.AddCollection(collectionKey)
		if err != nil {
			return nil, err
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
					return nil, err
				}
			}
		}

		err = collections.Load(nil, &metadataResponse, session)
		if err != nil {
			return nil, err
		}

		// Get the datasource from the object name
		collectionMetadata, err := metadataResponse.GetCollection(collectionKey)
		if err != nil {
			return nil, err
		}

		err = PopulateAndValidate(&request, collectionMetadata, session)
		if err != nil {
			return nil, err
		}

		err = RunBeforeSaveBots(&request, collectionMetadata, session)
		if err != nil {
			return nil, err
		}

		dsKey := collectionMetadata.DataSource
		batch := collated[dsKey]
		batch.Wires = append(batch.Wires, request)
		collated[dsKey] = batch

	}

	// 3. Get metadata for each datasource and collection
	for dsKey, batch := range collated {

		datasource, err := meta.NewDataSource(dsKey)
		if err != nil {
			return nil, err
		}

		err = bundle.Load(datasource, session)
		if err != nil {
			return nil, err
		}

		// Now figure out which data source adapter to use
		// and make the requests
		// It would be better to make this requests in parallel
		// instead of in series
		adapterType := datasource.GetAdapterType()
		adapter, err := adapt.GetAdapter(adapterType)
		if err != nil {
			return nil, err
		}
		credentials, err := adapt.GetCredentials(datasource, site)
		if err != nil {
			return nil, err
		}

		cascadeDeletes, err := getCascadeDeletes(batch.Wires, metadataResponse.Collections, &metadataResponse, adapter, credentials)
		if err != nil {
			return nil, err
		}

		adapterResponses, err := adapter.Save(batch.Wires, &metadataResponse, credentials)
		if err != nil {
			return nil, err
		}

		err = performCascadeDeletes(cascadeDeletes, session)
		if err != nil {
			return nil, err
		}

		for i, resp := range adapterResponses {

			request := requests.Wires[i]
			collectionKey := request.GetCollection()

			collectionMetadata, err := metadataResponse.GetCollection(collectionKey)
			if err != nil {
				return nil, err
			}

			err = RunAfterSaveBots(&resp, &request, collectionMetadata, session)
			if err != nil {
				return nil, err
			}
			response.Wires = append(response.Wires, resp)
		}

	}

	return &response, nil
}
