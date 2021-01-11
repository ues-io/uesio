package adapters

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/loadresponse"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"

	"github.com/thecloudmasters/uesio/pkg/templating"
)

func getUpsertLookupOp(request reqs.SaveRequest, matchField string, collectionMetadata *CollectionMetadata) *LoadOp {
	return &LoadOp{
		CollectionName: request.Collection,
		WireName:       request.Wire,
		Fields: []reqs.LoadRequestField{
			{
				ID: collectionMetadata.IDField,
			},
			{
				ID: matchField,
			},
		},
		Collection: &loadresponse.Collection{},
		// TODO: This is incomplete. We need to set the load
		// request conditions from the match fields
		Conditions: []reqs.LoadRequestCondition{},
	}
}

func getReferenceLookupOp(request reqs.SaveRequest, lookup reqs.Lookup, collectionMetadata *CollectionMetadata, metadata *MetadataCache) (*LoadOp, error) {
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
		WireName:       request.Wire,
		Fields: []reqs.LoadRequestField{
			{
				ID: refCollectionMetadata.IDField,
			},
			{
				ID: matchField,
			},
		},
		Collection: &loadresponse.Collection{},
		// TODO: This is incomplete. We need to set the load
		// request conditions from the match fields
		Conditions: []reqs.LoadRequestCondition{},
	}, nil
}

// GetLookupOps function
func GetLookupOps(request reqs.SaveRequest, metadata *MetadataCache) ([]LoadOp, error) {
	options := request.Options
	lookupRequests := []LoadOp{}
	collectionMetadata, err := metadata.GetCollection(request.Collection)
	if err != nil {
		return nil, err
	}

	if options == nil {
		return nil, nil
	}

	if options.Upsert != nil {
		// If we have a match field option, use that, otherwise, use the name field
		upsertKey := getStringWithDefault(options.Upsert.MatchField, collectionMetadata.NameField)
		lookupRequests = append(lookupRequests, *getUpsertLookupOp(request, upsertKey, collectionMetadata))
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

func getLookupResultMap(op *LoadOp, keyField string) (map[string]metadata.LoadableItem, error) {
	lookupResult := map[string]metadata.LoadableItem{}
	err := op.Collection.Loop(func(item metadata.LoadableItem) error {
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

func mergeUpsertLookupResponse(op *LoadOp, changes map[string]reqs.ChangeRequest, options *reqs.UpsertOptions, collectionMetadata *CollectionMetadata) error {

	matchField := getStringWithDefault(options.MatchField, collectionMetadata.IDField)
	lookupResult, err := getLookupResultMap(op, matchField)
	if err != nil {
		return err
	}

	matchTemplate := getStringWithDefault(options.MatchTemplate, collectionMetadata.IDFormat)

	template, err := templating.New(matchTemplate)
	if err != nil {
		return err
	}

	if template == nil {
		return errors.New("Cannot upsert without id format metadata")
	}

	for index, change := range changes {

		keyVal, err := templating.Execute(template, change.FieldChanges)
		if err != nil || keyVal == "" {
			return errors.New("Could not get key for upsert change")
		}
		match, ok := lookupResult[keyVal]

		// If we find a match, populate the id field so that it's an update instead of an insert
		if ok {
			idValue, err := match.GetField(collectionMetadata.IDField)
			if err != nil {
				return err
			}
			change.FieldChanges[collectionMetadata.IDField] = idValue
			change.IsNew = false
			change.IDValue = idValue
			changes[index] = change
		}

	}
	return nil
}

func mergeReferenceLookupResponse(op *LoadOp, lookup reqs.Lookup, changes map[string]reqs.ChangeRequest, collectionMetadata *CollectionMetadata, metadata *MetadataCache) error {

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

		keyRef := change.FieldChanges[lookupField].(map[string]interface{})
		keyVal := keyRef[matchField].(string)
		match, ok := lookupResult[keyVal]

		if ok {
			idValue, err := match.GetField(refCollectionMetadata.IDField)
			if err != nil {
				return err
			}
			change.FieldChanges[fieldMetadata.ForeignKeyField] = idValue
		} else {
			change.FieldChanges[fieldMetadata.ForeignKeyField] = nil
		}

	}
	return nil
}

// MergeLookupResponses function
func MergeLookupResponses(request reqs.SaveRequest, responses []LoadOp, metadata *MetadataCache) error {

	collectionMetadata, err := metadata.GetCollection(request.Collection)
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
		err := mergeUpsertLookupResponse(upsertResponse, request.Changes, request.Options.Upsert, collectionMetadata)
		if err != nil {
			return err
		}
	}

	return nil
}
