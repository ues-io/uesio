package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func HandleLookups(
	loader Loader,
	request *SaveOp,
	metadata *MetadataCache,
) error {
	lookupOps, err := getLookupOps(request, metadata)
	if err != nil {
		return err
	}

	if len(lookupOps) == 0 {
		return nil
	}

	err = loader(lookupOps)
	if err != nil {
		return err
	}

	return mergeLookupResponses(request, lookupOps, metadata)

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

	matchField := getStringWithDefault(lookup.MatchField, refCollectionMetadata.NameField)
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
		// TODO: This is incomplete. We need to set the load
		// request conditions from the match fields
		Conditions: []LoadRequestCondition{},
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
		upsertKey := getStringWithDefault(options.Upsert.MatchField, collectionMetadata.NameField)

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
			// TODO: This is incomplete. We need to set the load
			// request conditions from the match fields
			Conditions: []LoadRequestCondition{},
		})
	}
	for _, lookup := range request.Options.Lookups {
		referenceLookup, err := getReferenceLookupOp(request, lookup, collectionMetadata, metadata)
		if err != nil {
			return nil, err
		}
		lookupRequests = append(lookupRequests, *referenceLookup)
	}

	return lookupRequests, nil
}

func getLookupResultMap(op *LoadOp, keyField string) (map[string]loadable.Item, error) {
	lookupResult := map[string]loadable.Item{}
	err := op.Collection.Loop(func(item loadable.Item) error {
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

func mergeUpsertLookupResponse(op *LoadOp, changes ChangeItems, options *UpsertOptions, collectionMetadata *CollectionMetadata, metadata *MetadataCache) error {

	matchField := getStringWithDefault(options.MatchField, collectionMetadata.IDField)
	lookupResult, err := getLookupResultMap(op, matchField)
	if err != nil {
		return err
	}

	matchTemplate := getStringWithDefault(options.MatchTemplate, collectionMetadata.IDFormat)

	template, err := NewFieldChanges(matchTemplate, collectionMetadata, metadata)
	if err != nil {
		return err
	}

	if template == nil {
		return errors.New("Cannot upsert without id format metadata")
	}

	for index, change := range changes {

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
			change.FieldChanges.SetField(collectionMetadata.IDField, idValue)
			change.IsNew = false
			change.IDValue = idValue
			changes[index] = change
		}

	}
	return nil
}

func mergeReferenceLookupResponse(op *LoadOp, lookup Lookup, changes ChangeItems, collectionMetadata *CollectionMetadata, metadata *MetadataCache) error {

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

	matchField := getStringWithDefault(lookup.MatchField, refCollectionMetadata.NameField)

	lookupResult, err := getLookupResultMap(op, matchField)
	if err != nil {
		return err
	}

	for _, change := range changes {

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
		err := mergeReferenceLookupResponse(&lookupResponse, lookup, request.Changes, collectionMetadata, metadata)
		if err != nil {
			return err
		}

	}

	if upsertResponse != nil {
		err := mergeUpsertLookupResponse(upsertResponse, request.Changes, request.Options.Upsert, collectionMetadata, metadata)
		if err != nil {
			return err
		}
	}

	return nil
}
