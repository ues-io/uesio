package sqlshared

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

//GetDBFieldName function
func GetDBFieldName(fieldMetadata *adapt.FieldMetadata) (string, error) {
	if fieldMetadata.PropertyName == "" {
		return "", errors.New("Could not get DB Field Name: Missing important field metadata: " + fieldMetadata.Name)
	}
	return fieldMetadata.PropertyName, nil
}

//GetDBCollectionName function
func GetDBCollectionName(collectionMetadata *adapt.CollectionMetadata) (string, error) {
	if collectionMetadata.CollectionName == "" {
		return "", errors.New("Could not get DB Collection Name: Missing important collection metadata: " + collectionMetadata.Name)
	}
	return collectionMetadata.CollectionName, nil
}
