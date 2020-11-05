package sqlshared

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapters"
)

func GetDBFieldName(fieldMetadata *adapters.FieldMetadata) (string, error) {
	if fieldMetadata.PropertyName == "" {
		return "", errors.New("Could not get DB Field Name: Missing important field metadata: " + fieldMetadata.Name)
	}
	return fieldMetadata.PropertyName, nil
}

func GetDBCollectionName(collectionMetadata *adapters.CollectionMetadata) (string, error) {
	if collectionMetadata.CollectionName == "" {
		return "", errors.New("Could not get DB Collection Name: Missing important collection metadata: " + collectionMetadata.Name)
	}
	return collectionMetadata.CollectionName, nil
}
