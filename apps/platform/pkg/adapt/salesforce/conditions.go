package salesforce

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func getConditions(
	op *adapt.LoadOp,
	metadata *adapt.MetadataCache,
	collectionMetadata *adapt.CollectionMetadata,
	ops []*adapt.LoadOp,
	credentials *adapt.Credentials,
	userTokens []string,
) ([]string, []interface{}, error) {

	tenantID := credentials.GetTenantID()
	collectionName, err := getDBCollectionName(collectionMetadata, tenantID)
	if err != nil {
		return nil, nil, err
	}

	conditionStrings := []string{"collection = $1"}

	values := []interface{}{collectionName}

	return conditionStrings, values, nil
}
