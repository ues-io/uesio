package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Load function
func Load(requests LoadRequestBatch, session *sess.Session) (*LoadResponseBatch, error) {

	site := session.GetSite()

	collated := map[string]LoadRequestBatch{}
	collatedMetadata := map[string]*adapters.MetadataCache{}
	metadataResponse := adapters.MetadataCache{}
	response := LoadResponseBatch{}

	// Loop over the requests and batch per data source
	for _, request := range requests.Wires {

		collectionKey := request.GetCollection()

		// Keep a running tally of all requested collections
		collections := MetadataRequest{}
		collections.AddCollection(collectionKey)

		for _, requestField := range request.Fields {
			collections.AddField(collectionKey, requestField.ID, nil)
		}

		for _, condition := range request.Conditions {

			if condition.Type == "SEARCH" {
				// We don't need any extra field metadata for search conditions yet
				continue
			}
			collections.AddField(collectionKey, condition.Field, nil)

			if condition.ValueSource == "LOOKUP" && condition.LookupField != "" && condition.LookupWire != "" {

				lookupRequest, err := reqs.GetRequestByWireName(requests.Wires, condition.LookupWire)
				if err != nil {
					return nil, err
				}

				lookupCollectionKey := lookupRequest.GetCollection()
				collections.AddField(lookupCollectionKey, condition.LookupField, nil)
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
		if request.Type != "CREATE" {
			batch.Wires = append(batch.Wires, request)
		}
		collated[dsKey] = batch
	}

	// 3. Get metadata for each datasource and collection
	for dsKey, batch := range collated {

		datasource, err := metadata.NewDataSource(dsKey)
		if err != nil {
			return nil, err
		}

		err = LoadMetadataItem(datasource, session)
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

		adapterResponses, err := adapter.Load(batch.Wires, collatedMetadata[dsKey], credentials)
		if err != nil {
			return nil, err
		}

		for _, r := range adapterResponses {
			response.Wires = append(response.Wires, r)
		}

	}

	response.Collections = metadataResponse.Collections

	return &response, nil
}
