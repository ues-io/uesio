package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/bots"
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

		var robots metadata.BotCollection
		conditions := []reqs.LoadRequestCondition{}
		collectionNamespace, _, err := metadata.ParseKey(collectionKey)
		if err != nil {
			return nil, err
		}

		conditions = append(conditions, reqs.LoadRequestCondition{
			Field: "uesio.trigger",
			Value: "BEFORE",
		})

		err = LoadMetadataCollection(&robots, collectionNamespace, conditions, session)
		if err != nil {
			return nil, err
		}

		err = bots.RunBotsBefore(robots, &request, collectionMetadata, session)
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
		adapterResponses, err := adapter.Save(batch.Wires, collatedMetadata[dsKey], credentials)
		if err != nil {
			return nil, err
		}

		err = cleanUpFiles(batch.Wires, session)
		if err != nil {
			return nil, err
		}

		//After Save Bots
		var secondSaves []reqs.SaveRequest
		for _, r := range adapterResponses {

			var robots metadata.BotCollection
			conditions := []reqs.LoadRequestCondition{}
			//GET current collection, a better way to do this?
			collectionNamespace, _, err := metadata.ParseKey(dsKey)
			if err != nil {
				return nil, err
			}
			var currentCollection = collectionNamespace + "." + r.Wire

			conditions = append(conditions, reqs.LoadRequestCondition{
				Field: "uesio.trigger",
				Value: "AFTER",
			})

			//Like this I make sure that I just run robots if I am in the right collection
			conditions = append(conditions, reqs.LoadRequestCondition{
				Field: "uesio.collection",
				Value: currentCollection,
			})

			err = LoadMetadataCollection(&robots, collectionNamespace, conditions, session)
			if err != nil {
				return nil, err
			}

			//DO this if there are Robtos
			if len(robots) > 0 {
				err = bots.RunBotsAfter(robots, &r, session, currentCollection)
				if err != nil {
					return nil, err
				}

				secondSave := r.ToSaveRequest(currentCollection)
				secondSaves = append(secondSaves, secondSave)
			} else {
				response.Wires = append(response.Wires, r)
			}

		}

		//DO this if there are SecondSaves
		if len(secondSaves) > 0 {

			//Exclude the delets from the second save since they are already deleted
			//Add them to the response otherwise we don't notice the changes
			aux := make([]reqs.SaveRequest, len(secondSaves))
			copy(aux, secondSaves)
			for i, save := range aux {
				save.Deletes = nil
				aux[i] = save
			}

			SecondAdapterResponses, err := adapter.Save(aux, collatedMetadata[dsKey], credentials)
			if err != nil {
				return nil, err
			}

			for i, r := range SecondAdapterResponses {
				for key, value := range secondSaves[i].Deletes {
					var chresl reqs.ChangeResult
					chresl.Data = value
					r.DeleteResults[key] = chresl
				}
				response.Wires = append(response.Wires, r)
			}
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
