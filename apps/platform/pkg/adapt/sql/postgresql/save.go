package postgresql

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	sqlshared "github.com/thecloudmasters/uesio/pkg/adapt/sql"

	sq "github.com/Masterminds/squirrel"
)

// Save function
func (a *Adapter) Save(requests []adapt.SaveRequest, metadata *adapt.MetadataCache, credentials *adapt.Credentials) ([]adapt.SaveResponse, error) {

	response := []adapt.SaveResponse{}

	db, err := connect()
	if err != nil {
		return nil, errors.New("Failed to connect to PostgreSQL:" + err.Error())
	}
	defer db.Close()

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)

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

		response = append(response, adapt.SaveResponse{
			Wire:          request.Wire,
			ChangeResults: changeResults,
			DeleteResults: deleteResults,
		})
	}

	return response, nil
}
