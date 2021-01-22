package dynamodb

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// Migrate function
func (a *Adapter) Migrate(metadata *adapt.MetadataCache, credentials *adapt.Credentials) error {
	fmt.Println("Migrating dynamoDB")

	client := getDynamoDB(credentials)

	for _, collectionMetadata := range metadata.Collections {

		collectionName, err := getDBCollectionName(collectionMetadata)
		if err != nil {
			return err
		}

		addTable, err := describeTableDynamoDB(collectionName, client)
		if err != nil {
			return err
		}

		idField, err := collectionMetadata.GetIDField()
		if err != nil {
			return err
		}

		if addTable {
			idFieldName, err := getDBFieldName(idField)
			if err != nil {
				return err
			}
			err = createTableDynamoDB(collectionName, idFieldName, client)
			if err != nil {
				return err
			}
		}

	}

	return nil
}
