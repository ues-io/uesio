package adapt

func HandleOldValuesLookup(
	loader Loader,
	op *SaveOp,
	metadata *MetadataCache,
) error {
	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	allFields := []LoadRequestField{}

	for fieldID := range collectionMetadata.Fields {
		allFields = append(allFields, LoadRequestField{
			ID: fieldID,
		})
	}

	// Go through all the changes and get a list of the upsert keys
	ids := []string{}
	for _, change := range *op.Updates {
		ids = append(ids, change.IDValue)
	}
	for _, change := range *op.Deletes {
		ids = append(ids, change.IDValue)
	}

	if len(ids) == 0 {
		return nil
	}

	oldValuesOp := &LoadOp{
		CollectionName: op.CollectionName,
		WireName:       op.WireName,
		Fields:         allFields,
		Collection:     &Collection{},
		Conditions: []LoadRequestCondition{
			{
				Field:    ID_FIELD,
				Operator: "IN",
				Value:    ids,
			},
		},
		Query: true,
	}

	err = loader([]*LoadOp{oldValuesOp})
	if err != nil {
		return err
	}

	oldValuesLookup, err := getLookupResultMap(oldValuesOp, ID_FIELD)
	if err != nil {
		return err
	}

	for index, change := range *op.Updates {
		oldValues, ok := oldValuesLookup[change.IDValue]
		if !ok {
			return err
		}
		(*op.Updates)[index].OldValues = oldValues
	}
	for index, change := range *op.Deletes {
		oldValues, ok := oldValuesLookup[change.IDValue]
		if !ok {
			return err
		}
		(*op.Deletes)[index].OldValues = oldValues
	}

	return nil
}
