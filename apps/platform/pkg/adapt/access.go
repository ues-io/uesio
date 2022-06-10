package adapt

func GetChallengeCollection(metadata *MetadataCache, collectionMetadata *CollectionMetadata) (*CollectionMetadata, error) {
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
