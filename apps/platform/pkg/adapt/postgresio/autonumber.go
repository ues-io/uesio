package postgresio

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func (a *Adapter) GetAutonumber(collectionMetadata *adapt.CollectionMetadata, credentials *adapt.Credentials) (int, error) {

	db, err := connect(credentials)
	if err != nil {
		return 0, errors.New("Failed to connect PostgreSQL:" + err.Error())
	}

	collectionName, err := getDBCollectionName(collectionMetadata, credentials.GetTenantID())
	if err != nil {
		return 0, err
	}

	query := "SELECT COALESCE(MAX(autonumber),0) FROM public.data WHERE collection = $1"

	var count int
	err = db.QueryRow(context.Background(), query, collectionName).Scan(&count)
	if err != nil {
		return 0, errors.New("Failed to load rows in PostgreSQL:" + err.Error() + " : " + query)
	}

	return count, nil
}
