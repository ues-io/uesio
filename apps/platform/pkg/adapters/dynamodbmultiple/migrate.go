package dynamodbmultiple

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/creds"

	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// Migrate function
func (a *Adapter) Migrate(metadata *adapters.MetadataCache, credentials *creds.AdapterCredentials) error {
	fmt.Println("Migrating dynamoDB")

	client := getDynamoDB(credentials)

	for _, collectionMetadata := range metadata.Collections {

		collectionName, err := getDBCollectionName(collectionMetadata)
		if err != nil {
			return err
		}

		addTable, err := describeTableDynamoDB(collectionName, client)

		if addTable {
			idFieldName, _ := getDBFieldName(collectionMetadata.Fields[collectionMetadata.IDField])
			err = createTableDynamoDB(collectionName, idFieldName, client)
			if err != nil {
				return err
			}
		}

	}

	return nil
}
