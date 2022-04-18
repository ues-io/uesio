package adapt

func GetChallengeCollection(metadata *MetadataCache, collectionMetadata *CollectionMetadata) (*CollectionMetadata, error) {
	if collectionMetadata.AccessField == "" {
		return collectionMetadata, nil
	}
	fieldMetadata, err := collectionMetadata.GetField(collectionMetadata.AccessField)
	if err != nil {
		return nil, err
	}
	return metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
}
