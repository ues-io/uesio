package mysql

import (
	"errors"

	sqlshared "github.com/thecloudmasters/uesio/pkg/adapters/sql"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/reqs"

	sq "github.com/Masterminds/squirrel"
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

func (a *Adapter) handleLookups(request reqs.SaveRequest, metadata *adapters.MetadataCache, credentials *creds.AdapterCredentials) error {
	lookupRequests, err := adapters.GetLookupRequests(request, metadata)
	if err != nil {
		return err
	}

	if lookupRequests != nil && len(lookupRequests) > 0 {
		lookupResponses, err := a.Load(lookupRequests, metadata, credentials)
		if err != nil {
			return err
		}

		err = adapters.MergeLookupResponses(request, lookupResponses, metadata)
		if err != nil {
			return err
		}
	}

	return nil
}

// Save function
func (a *Adapter) Save(requests []reqs.SaveRequest, metadata *adapters.MetadataCache, credentials *creds.AdapterCredentials) ([]reqs.SaveResponse, error) {

	response := []reqs.SaveResponse{}

	db, err := connect()
	defer db.Close()

	if err != nil {
		return nil, errors.New("Failed to connect to MySQL:" + err.Error())
	}

	psql := sq.StatementBuilder

	for _, request := range requests {

		collectionMetadata, ok := metadata.Collections[request.Collection]
		if !ok {
			return nil, errors.New("No metadata provided for collection: " + request.Collection)
		}

		collectionName, err := sqlshared.GetDBCollectionName(collectionMetadata)
		if err != nil {
			return nil, err
		}

		// Sometimes we only have the name of something instead of it's real id
		// We can use this lookup functionality to get the real id before the save.
		err = a.handleLookups(request, metadata, credentials)
		if err != nil {
			return nil, err
		}

		changeResults, err := sqlshared.ProcessChanges(request.Changes, collectionName, collectionMetadata, psql, db)
		if err != nil {
			return nil, err
		}

		deleteResults, err := sqlshared.ProcessDeletes(request.Deletes, collectionName, collectionMetadata, psql, db)
		if err != nil {
			return nil, err
		}

		response = append(response, reqs.SaveResponse{
			Wire:          request.Wire,
			ChangeResults: changeResults,
			DeleteResults: deleteResults,
		})
	}

	return response, nil
}
