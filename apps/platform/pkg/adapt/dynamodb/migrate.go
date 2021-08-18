package dynamodb

import (
	"context"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// // Migrate function
func (a *Adapter) Migrate(metadata *adapt.MetadataCache, credentials *adapt.Credentials) error {
	fmt.Println("Migrating dynamoDB")

	ctx := context.Background()
	client, err := getDynamoDB(ctx, credentials)
	if err != nil {
		return err
	}

	tenantID := credentials.GetTenantID()

	for _, collectionMetadata := range metadata.Collections {

		collectionName, err := getDBCollectionName(collectionMetadata, tenantID)
		if err != nil {
			return err
		}

		addTable, err := describeTableDynamoDB(ctx, collectionName, client)
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
			err = createTableDynamoDB(ctx, collectionName, idFieldName, client)
			if err != nil {
				return err
			}
		}

	}

	return nil
}
