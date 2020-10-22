package adapters

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/reqs"

	"github.com/thecloudmasters/uesio/pkg/templating"
)

func getUpsertLookupReqeust(request reqs.SaveRequest, matchField string, collectionMetadata *CollectionMetadata) *reqs.LoadRequest {
	return &reqs.LoadRequest{
		Collection: request.Collection,
		Wire:       request.Wire,
		Fields: []reqs.LoadRequestField{
			{
				ID: collectionMetadata.IDField,
			},
			{
				ID: matchField,
			},
		},
		// TODO: This is incomplete. We need to set the load
		// request conditions from the match fields
		Conditions: []reqs.LoadRequestCondition{},
	}
}

func getReferenceLookupRequest(request reqs.SaveRequest, lookup reqs.Lookup, collectionMetadata *CollectionMetadata, metadata *MetadataCache) (*reqs.LoadRequest, error) {
	fieldMetadata, ok := collectionMetadata.Fields[lookup.RefField]
	if !ok {
		return nil, errors.New("No metadata provided for field: " + lookup.RefField)
	}

	if fieldMetadata.Type != "REFERENCE" {
		return nil, errors.New("Can only lookup on reference field: " + lookup.RefField)
	}

	refCollectionMetadata, ok := metadata.Collections[fieldMetadata.ReferencedCollection]
	if !ok {
		return nil, errors.New("No metadata provided for collection: " + request.Collection)
	}

	matchField := getStringWithDefault(lookup.MatchField, refCollectionMetadata.NameField)
	return &reqs.LoadRequest{
		Collection: fieldMetadata.ReferencedCollection,
		Wire:       request.Wire,
		Fields: []reqs.LoadRequestField{
			{
				ID: refCollectionMetadata.IDField,
			},
			{
				ID: matchField,
			},
		},
		// TODO: This is incomplete. We need to set the load
		// request conditions from the match fields
		Conditions: []reqs.LoadRequestCondition{},
	}, nil
}

// GetLookupRequests function
func GetLookupRequests(request reqs.SaveRequest, metadata *MetadataCache) ([]reqs.LoadRequest, error) {
	options := request.Options
	lookupRequests := []reqs.LoadRequest{}
	collectionMetadata, ok := metadata.Collections[request.Collection]
	if !ok {
		return nil, errors.New("No metadata provided for collection: " + request.Collection)
	}

	if options == nil {
		return nil, nil
	}

	if options.Upsert != nil {
		// If we have a match field option, use that, otherwise, use the name field
		upsertKey := getStringWithDefault(options.Upsert.MatchField, collectionMetadata.NameField)
		lookupRequests = append(lookupRequests, *getUpsertLookupReqeust(request, upsertKey, collectionMetadata))
	}
	for _, lookup := range request.Options.Lookups {
		referenceLookup, err := getReferenceLookupRequest(request, lookup, collectionMetadata, metadata)
		if err != nil {
			return nil, err
		}
		lookupRequests = append(lookupRequests, *referenceLookup)
	}

	return lookupRequests, nil
}

func getLookupResultMap(data []map[string]interface{}, keyField string) map[string]map[string]interface{} {
	lookupResult := map[string]map[string]interface{}{}
	for _, record := range data {
		keyVal := record[keyField].(string)
		lookupResult[keyVal] = record
	}
	return lookupResult
}

func mergeUpsertLookupResponse(response *reqs.LoadResponse, changes map[string]reqs.ChangeRequest, options *reqs.UpsertOptions, collectionMetadata *CollectionMetadata) error {

	matchField := getStringWithDefault(options.MatchField, collectionMetadata.IDField)
	lookupResult := getLookupResultMap(response.Data, matchField)

	matchTemplate := getStringWithDefault(options.MatchTemplate, collectionMetadata.IDFormat)

	template, err := templating.New(matchTemplate)
	if err != nil {
		return err
	}

	if template == nil {
		return errors.New("Cannot upsert without id format metadata")
	}

	for _, change := range changes {

		keyVal, err := templating.Execute(template, change)
		if err != nil || keyVal == "" {
			return errors.New("Could not get key for upsert change")
		}
		match, ok := lookupResult[keyVal]

		// If we find a match, populate the id field so that it's an update instead of an insert
		if ok {
			change[collectionMetadata.IDField] = match[collectionMetadata.IDField]
		}

	}
	return nil
}

func mergeReferenceLookupResponse(response *reqs.LoadResponse, lookup reqs.Lookup, changes map[string]reqs.ChangeRequest, collectionMetadata *CollectionMetadata, metadata *MetadataCache) error {

	lookupField := lookup.RefField

	fieldMetadata, ok := collectionMetadata.Fields[lookupField]
	if !ok {
		return errors.New("No metadata provided for field: " + lookupField)
	}

	if fieldMetadata.Type != "REFERENCE" {
		return errors.New("Can only lookup on reference field: " + lookupField)
	}

	refCollectionMetadata, ok := metadata.Collections[fieldMetadata.ReferencedCollection]
	if !ok {
		return errors.New("No metadata provided for collection: " + fieldMetadata.ReferencedCollection)
	}

	matchField := getStringWithDefault(lookup.MatchField, refCollectionMetadata.NameField)

	lookupResult := getLookupResultMap(response.Data, matchField)

	for _, change := range changes {

		keyRef := change[lookupField].(map[string]interface{})
		keyVal := keyRef[matchField].(string)
		match, ok := lookupResult[keyVal]

		if ok {
			change[fieldMetadata.ForeignKeyField] = match[refCollectionMetadata.IDField]
		} else {
			change[fieldMetadata.ForeignKeyField] = nil
		}

	}
	return nil
}

// MergeLookupResponses function
func MergeLookupResponses(request reqs.SaveRequest, responses []reqs.LoadResponse, metadata *MetadataCache) error {

	collectionMetadata, ok := metadata.Collections[request.Collection]
	if !ok {
		return errors.New("No metadata provided for collection: " + request.Collection)
	}

	if request.Options == nil {
		return nil
	}

	var upsertResponse *reqs.LoadResponse

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
