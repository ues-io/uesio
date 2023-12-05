package adapt

import "github.com/thecloudmasters/uesio/pkg/types/wire"

func GetChallengeCollection(metadata *wire.MetadataCache, collectionMetadata *wire.CollectionMetadata) (*wire.CollectionMetadata, error) {
	if collectionMetadata.AccessField == "" {
		return collectionMetadata, nil
	}
	fieldMetadata, err := collectionMetadata.GetField(collectionMetadata.AccessField)
	if err != nil {
		return nil, err
	}
	refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
	if err != nil {
		return nil, err
	}

	return GetChallengeCollection(metadata, refCollectionMetadata)
}
