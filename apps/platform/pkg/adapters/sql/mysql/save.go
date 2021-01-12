package mysql

import (
	"errors"

	sqlshared "github.com/thecloudmasters/uesio/pkg/adapters/sql"
	"github.com/thecloudmasters/uesio/pkg/creds"

	sq "github.com/Masterminds/squirrel"
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// Save function
func (a *Adapter) Save(requests []adapters.SaveRequest, metadata *adapters.MetadataCache, credentials *creds.AdapterCredentials) ([]adapters.SaveResponse, error) {

	response := []adapters.SaveResponse{}

	db, err := connect()
	if err != nil {
		return nil, errors.New("Failed to connect to MySQL:" + err.Error())
	}
	defer db.Close()

	psql := sq.StatementBuilder

	for _, request := range requests {

		collectionMetadata, err := metadata.GetCollection(request.Collection)
		if err != nil {
			return nil, err
		}

		collectionName, err := sqlshared.GetDBCollectionName(collectionMetadata)
		if err != nil {
			return nil, err
		}

		// Sometimes we only have the name of something instead of it's real id
		// We can use this lookup functionality to get the real id before the save.
		err = sqlshared.HandleLookups(a, request, metadata, credentials)
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

		response = append(response, adapters.SaveResponse{
			Wire:          request.Wire,
			ChangeResults: changeResults,
			DeleteResults: deleteResults,
		})
	}

	return response, nil
}
