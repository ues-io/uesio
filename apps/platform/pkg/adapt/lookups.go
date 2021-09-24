package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func HandleLookups(
	loader Loader,
	batch []SaveOp,
	metadata *MetadataCache,
) error {
	for index, op := range batch {
		// Go through the op and see if we have any info that could help us
		// match reference lookups in other ops before this one
		err := mergeBatchInfo(&op, index, batch, metadata)
		if err != nil {
			return err
		}

		lookupOps, err := getLookupOps(&op, metadata)
		if err != nil {
			return err
		}

		if len(lookupOps) > 0 {
			err = loader(lookupOps)
			if err != nil {
				return err
			}

			err = mergeLookupResponses(&op, lookupOps, metadata)
			if err != nil {
				return err
			}
		}

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
			ids = append(ids, change.IDValue.(string))
		}
		for _, change := range *op.Deletes {
			ids = append(ids, change.IDValue.(string))
		}

		if len(ids) == 0 {
			continue
		}

		oldValuesOp := LoadOp{
			CollectionName: op.CollectionName,
			WireName:       op.WireName,
			Fields:         allFields,
			Collection:     &Collection{},
			Conditions: []LoadRequestCondition{
				{
					Field:    collectionMetadata.IDField,
					Operator: "IN",
					Value:    ids,
				},
			},
		}

		err = loader([]LoadOp{oldValuesOp})
		if err != nil {
			return err
		}

		oldValuesLookup, err := getLookupResultMap(&oldValuesOp, collectionMetadata.IDField)
		if err != nil {
			return err
		}

		for index, change := range *op.Updates {
			oldValues, ok := oldValuesLookup[change.IDValue.(string)]
			if !ok {
				return err
			}
			(*op.Updates)[index].OldValues = oldValues
		}
		for index, change := range *op.Deletes {
			oldValues, ok := oldValuesLookup[change.IDValue.(string)]
			if !ok {
				return err
			}
			(*op.Deletes)[index].OldValues = oldValues
		}

	}
	return nil

}

func mergeBatchInfo(op *SaveOp, index int, batch []SaveOp, metadata *MetadataCache) error {

	if op.Options == nil {
		return nil
	}
	// First check to see if they have any reference options
	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	for _, lookup := range op.Options.Lookups {
		fieldMetadata, err := collectionMetadata.GetField(lookup.RefField)
		if err != nil {
			return err
		}

		if fieldMetadata.Type != "REFERENCE" {
			return errors.New("Can only lookup on reference field: " + lookup.RefField)
		}

		refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferencedCollection)
		if err != nil {
			return err
		}

		refCollectionName := refCollectionMetadata.GetFullName()

		matchField := getStringWithDefault(lookup.MatchField, refCollectionMetadata.IDField)

		// Check to see if any of the ops in front of me have my ref's collection Name
		for i := 0; i < index; i++ {
			if batch[i].CollectionName == refCollectionName {
				// Make a map of all the items that could be referenced by id template
				template, err := NewFieldChanges(refCollectionMetadata.IDFormat, refCollectionMetadata)
				if err != nil {
					return err
				}

				if template == nil {
					return errors.New("Cannot pre-merge without id format metadata")
				}

				lookupResult := map[string]bool{}

				for _, item := range *batch[i].Inserts {
					id, err := templating.Execute(template, item.FieldChanges)
					if err != nil {
						return err
					}
					lookupResult[id] = true
				}

				for _, change := range *op.Inserts {

					keyRefInterface, err := change.FieldChanges.GetField(lookup.RefField)
					if err != nil {
						return err
					}
					keyRef := keyRefInterface.(map[string]interface{})
					keyVal := keyRef[matchField].(string)
					match, ok := lookupResult[keyVal]
					if ok && match {
						err = change.FieldChanges.SetField(fieldMetadata.GetFullName(), map[string]interface{}{
							refCollectionMetadata.IDField: keyVal,
						})
						if err != nil {
							return err
						}
					}
				}
			}
		}

	}
	return nil
}

func getReferenceLookupOp(request *SaveOp, lookup Lookup, collectionMetadata *CollectionMetadata, metadata *MetadataCache) (*LoadOp, error) {
	fieldMetadata, err := collectionMetadata.GetField(lookup.RefField)
	if err != nil {
		return nil, err
	}

	if fieldMetadata.Type != "REFERENCE" {
		return nil, errors.New("Can only lookup on reference field: " + lookup.RefField)
	}

	refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferencedCollection)
	if err != nil {
		return nil, err
	}

	matchField := getStringWithDefault(lookup.MatchField, refCollectionMetadata.IDField)
	matchTemplate := getStringWithDefault(lookup.MatchTemplate, refCollectionMetadata.IDFormat)

	template, err := NewFieldChanges(matchTemplate, refCollectionMetadata)
	if err != nil {
		return nil, err
	}

	if template == nil {
		return nil, errors.New("Cannot get reference op without id format metadata")
	}

	// Go through all the changes and get a list of the upsert keys
	ids := []string{}
	for _, change := range *request.Inserts {
		matchKeyValue, err := change.FieldChanges.GetField(lookup.RefField)
		if err != nil {
			continue
		}

		matchKeyValueItem := Item(matchKeyValue.(map[string]interface{}))

		// check to see if this item already has its id field set.
		// if so, we can just skip checking for it.
		idFieldValue, err := matchKeyValueItem.GetField(refCollectionMetadata.IDField)
		if err == nil && idFieldValue != "" {
			continue
		}

		referenceKeyValue, err := templating.Execute(template, &matchKeyValueItem)
		if err != nil {
			return nil, err
		}

		if referenceKeyValue == "" {
			continue
		}

		ids = append(ids, referenceKeyValue)
	}

	if len(ids) == 0 {
		return nil, nil
	}

	return &LoadOp{
		CollectionName: fieldMetadata.ReferencedCollection,
		WireName:       request.WireName,
		Fields: []LoadRequestField{
			{
				ID: refCollectionMetadata.IDField,
			},
			{
				ID: matchField,
			},
		},
		Collection: &Collection{},
		Conditions: []LoadRequestCondition{
			{
				Field:    matchField,
				Operator: "IN",
				Value:    ids,
			},
		},
	}, nil
}

func getLookupOps(request *SaveOp, metadata *MetadataCache) ([]LoadOp, error) {
	options := request.Options
	if options == nil {
		return nil, nil
	}
	lookupRequests := []LoadOp{}
	collectionMetadata, err := metadata.GetCollection(request.CollectionName)
	if err != nil {
		return nil, err
	}

	if options.Upsert != nil {
		// If we have a match field option, use that, otherwise, use the name field
		upsertKey := getStringWithDefault(options.Upsert.MatchField, collectionMetadata.IDField)
		matchTemplate := getStringWithDefault(options.Upsert.MatchTemplate, collectionMetadata.IDFormat)

		template, err := NewFieldChanges(matchTemplate, collectionMetadata)
		if err != nil {
			return nil, err
		}

		// Go through all the changes and get a list of the upsert keys
		ids := []string{}
		for _, change := range *request.Inserts {

			upsertKeyStringValue, err := templating.Execute(template, change.FieldChanges)
			if err != nil {
				continue
			}

			if upsertKeyStringValue == "" {
				continue
			}
			ids = append(ids, upsertKeyStringValue)
		}

		if len(ids) > 0 {

			lookupRequests = append(lookupRequests, LoadOp{
				CollectionName: request.CollectionName,
				WireName:       request.WireName,
				Fields: []LoadRequestField{
					{
						ID: collectionMetadata.IDField,
					},
					{
						ID: upsertKey,
					},
				},
				Collection: &Collection{},
				Conditions: []LoadRequestCondition{
					{
						Field:    upsertKey,
						Operator: "IN",
						Value:    ids,
					},
				},
			})
		}
	}
	for _, lookup := range request.Options.Lookups {
		referenceLookup, err := getReferenceLookupOp(request, lookup, collectionMetadata, metadata)
		if err != nil {
			return nil, err
		}
		if referenceLookup == nil {
			continue
		}
		lookupRequests = append(lookupRequests, *referenceLookup)
	}

	return lookupRequests, nil
}

func getLookupResultMap(op *LoadOp, keyField string) (map[string]loadable.Item, error) {
	lookupResult := map[string]loadable.Item{}
	err := op.Collection.Loop(func(item loadable.Item, _ interface{}) error {
		keyVal, err := item.GetField(keyField)
		if err == nil {
			keyString, ok := keyVal.(string)
			if ok {
				lookupResult[keyString] = item
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return lookupResult, nil
}

func mergeUpsertLookupResponse(op *LoadOp, inserts *ChangeItems, updates *ChangeItems, options *UpsertOptions, collectionMetadata *CollectionMetadata, metadata *MetadataCache) error {

	upsertKey := getStringWithDefault(options.MatchField, collectionMetadata.IDField)
	matchTemplate := getStringWithDefault(options.MatchTemplate, collectionMetadata.IDFormat)

	lookupResult, err := getLookupResultMap(op, upsertKey)
	if err != nil {
		return err
	}

	template, err := NewFieldChanges(matchTemplate, collectionMetadata)
	if err != nil {
		return err
	}

	if template == nil {
		return errors.New("Cannot upsert without id format metadata")
	}

	newInserts := ChangeItems{}
	for _, change := range *inserts {

		keyVal, err := templating.Execute(template, change.FieldChanges)
		if err != nil || keyVal == "" {
			return errors.New("Could not get key for upsert change: " + err.Error() + " : " + keyVal)
		}
		match, ok := lookupResult[keyVal]

		// If we find a match, populate the id field so that it's an update instead of an insert
		if ok {
			idValue, err := match.GetField(collectionMetadata.IDField)
			if err != nil {
				return err
			}
			err = change.FieldChanges.SetField(collectionMetadata.IDField, idValue)
			if err != nil {
				return err
			}
			change.IDValue = idValue
			*updates = append(*updates, change)
		} else {
			newInserts = append(newInserts, change)
		}

	}
	*inserts = newInserts
	return nil
}

func mergeReferenceLookupResponse(op *LoadOp, lookup Lookup, changes *ChangeItems, collectionMetadata *CollectionMetadata, metadata *MetadataCache) error {

	lookupField := lookup.RefField

	fieldMetadata, err := collectionMetadata.GetField(lookupField)
	if err != nil {
		return err
	}

	if fieldMetadata.Type != "REFERENCE" {
		return errors.New("Can only lookup on reference field: " + lookupField)
	}

	refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferencedCollection)
	if err != nil {
		return err
	}

	matchField := getStringWithDefault(lookup.MatchField, refCollectionMetadata.IDField)

	lookupResult, err := getLookupResultMap(op, matchField)
	if err != nil {
		return err
	}

	for _, change := range *changes {

		keyRefInterface, err := change.FieldChanges.GetField(lookupField)
		if err != nil {
			return err
		}
		keyRef := keyRefInterface.(map[string]interface{})
		keyVal := keyRef[matchField].(string)
		match, ok := lookupResult[keyVal]
		if ok {
			idValue, err := match.GetField(refCollectionMetadata.IDField)
			if err != nil {
				return err
			}
			err = change.FieldChanges.SetField(fieldMetadata.GetFullName(), map[string]interface{}{
				refCollectionMetadata.IDField: idValue,
			})
			if err != nil {
				return err
			}

		} else {
			err := change.FieldChanges.SetField(fieldMetadata.GetFullName(), nil)
			if err != nil {
				return err
			}
		}

	}
	return nil
}

func mergeLookupResponses(request *SaveOp, responses []LoadOp, metadata *MetadataCache) error {

	collectionMetadata, err := metadata.GetCollection(request.CollectionName)
	if err != nil {
		return err
	}

	if request.Options == nil {
		return nil
	}

	var upsertResponse *LoadOp

	// If we're doing an upsert, then the first response is going to be the upsert response,
	// while all the other responses will be "lookup responses" for matching foreign keys.
	if request.Options.Upsert != nil {
		upsertResponse = &responses[0]
		responses = responses[1:]
	}

	for index, lookupResponse := range responses {
		lookup := request.Options.Lookups[index]
		err := mergeReferenceLookupResponse(&lookupResponse, lookup, request.Inserts, collectionMetadata, metadata)
		if err != nil {
			return err
		}
		err = mergeReferenceLookupResponse(&lookupResponse, lookup, request.Updates, collectionMetadata, metadata)
		if err != nil {
			return err
		}
	}

	if upsertResponse != nil {
		err := mergeUpsertLookupResponse(upsertResponse, request.Inserts, request.Updates, request.Options.Upsert, collectionMetadata, metadata)
		if err != nil {
			return err
		}
	}

	return nil
}
