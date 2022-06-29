package adapt

/*
func HandleReferenceLookups(
	connection Connection,
	op *SaveOp,
) error {

	metadata := connection.GetMetadata()
	options := op.Options
	if options == nil {
		return nil
	}

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	referencedCollections := ReferenceRegistry{}

	for _, lookup := range op.Options.Lookups {

		fieldMetadata, err := collectionMetadata.GetField(lookup.RefField)
		if err != nil {
			return err
		}

		if fieldMetadata.Type != "REFERENCE" {
			return errors.New("Can only lookup on reference field: " + lookup.RefField)
		}

		refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
		if err != nil {
			return err
		}

		refReq := referencedCollections.Get(fieldMetadata.ReferenceMetadata.Collection)
		refReq.Metadata = refCollectionMetadata
		refReq.MatchField = UNIQUE_KEY_FIELD

		refReq.AddFields([]LoadRequestField{
			{
				ID: UNIQUE_KEY_FIELD,
			},
		})

		err = op.LoopChanges(func(change *ChangeItem) error {
			matchKeyValue, err := change.FieldChanges.GetField(lookup.RefField)
			if err != nil {
				return nil
			}

			matchKeyValueItem, ok := matchKeyValue.(loadable.Item)
			if !ok {
				return errors.New("Not a valid reference item provided")
			}

			// check to see if this item already has its id field set.
			// if so, we can just skip checking for it.
			idFieldValue, err := matchKeyValueItem.GetField(ID_FIELD)
			if err == nil && idFieldValue != "" {
				return nil
			}

			uniqueKeyFieldValue, err := matchKeyValueItem.GetField(UNIQUE_KEY_FIELD)
			if err == nil && uniqueKeyFieldValue != "" {
				refReq.AddID(uniqueKeyFieldValue, ReferenceLocator{
					Item:  change,
					Field: fieldMetadata,
				})
				return nil
			}

			referenceKeyValue, err := SetUniqueKey(matchKeyValueItem, refCollectionMetadata)
			if err != nil {
				return err
			}

			refReq.AddID(referenceKeyValue, ReferenceLocator{
				Item:  change,
				Field: fieldMetadata,
			})

			return nil
		})
		if err != nil {
			return err
		}

	}

	return HandleReferences(connection, referencedCollections)
}
*/
