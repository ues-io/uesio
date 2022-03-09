package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/templating"
)

func HandleReferenceLookups(
	loader Loader,
	op *SaveOp,
	metadata *MetadataCache,
) error {

	options := op.Options
	if options == nil {
		return nil
	}
	lookupRequests := []*LoadOp{}
	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	for _, lookup := range op.Options.Lookups {
		referenceLookup, err := getReferenceLookupOp(op, lookup, collectionMetadata, metadata)
		if err != nil {
			return err
		}
		if referenceLookup == nil {
			continue
		}
		lookupRequests = append(lookupRequests, referenceLookup)
	}

	err = loader(lookupRequests)
	if err != nil {
		return err
	}

	for index, lookupResponse := range lookupRequests {
		lookup := op.Options.Lookups[index]
		err := mergeReferenceLookupResponse(lookupResponse, lookup, op.Inserts, collectionMetadata, metadata)
		if err != nil {
			return err
		}
		err = mergeReferenceLookupResponse(lookupResponse, lookup, op.Updates, collectionMetadata, metadata)
		if err != nil {
			return err
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

	refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
	if err != nil {
		return nil, err
	}

	matchField := getStringWithDefault(lookup.MatchField, ID_FIELD)
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
		idFieldValue, err := matchKeyValueItem.GetField(ID_FIELD)
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

	for _, change := range *request.Updates {
		matchKeyValue, err := change.FieldChanges.GetField(lookup.RefField)
		if err != nil {
			continue
		}

		matchKeyValueItem := Item(matchKeyValue.(map[string]interface{}))

		// check to see if this item already has its id field set.
		// if so, we can just skip checking for it.
		idFieldValue, err := matchKeyValueItem.GetField(ID_FIELD)
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
		CollectionName: fieldMetadata.ReferenceMetadata.Collection,
		WireName:       request.WireName,
		Fields: []LoadRequestField{
			{
				ID: ID_FIELD,
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
		Query: true,
	}, nil
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

	matchField := getStringWithDefault(lookup.MatchField, ID_FIELD)

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
			idValue, err := match.GetField(ID_FIELD)
			if err != nil {
				return err
			}
			err = change.FieldChanges.SetField(fieldMetadata.GetFullName(), map[string]interface{}{
				ID_FIELD: idValue,
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
