package firestore

import (
	"context"
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/reqs"

	"cloud.google.com/go/firestore"
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"google.golang.org/api/iterator"
)

func loadOne(
	ctx context.Context,
	client *firestore.Client,
	wire reqs.LoadRequest,
	metadata *adapters.MetadataCache,
	requests []reqs.LoadRequest,
	responses []reqs.LoadResponse,
) (*reqs.LoadResponse, error) {

	collectionMetadata, err := metadata.GetCollection(wire.Collection)
	if err != nil {
		return nil, err
	}

	collectionName, err := getDBCollectionName(collectionMetadata)
	if err != nil {
		return nil, err
	}

	collection := client.Collection(collectionName)
	var query firestore.Query

	fieldMap, referenceFields, err := adapters.GetFieldsMap(wire.Fields, collectionMetadata, metadata)
	if err != nil {
		return nil, err
	}

	fieldIDs := []string{}

	for _, fieldMetadata := range fieldMap {
		firestoreFieldName, err := getDBFieldName(fieldMetadata)
		if err != nil {
			return nil, err
		}
		fieldIDs = append(fieldIDs, firestoreFieldName)
	}

	if len(fieldIDs) == 0 {
		return nil, errors.New("No fields selected")
	}
	query = collection.Select(fieldIDs...)

	if wire.Conditions != nil {

		for _, condition := range wire.Conditions {

			if condition.Type == "SEARCH" {
				// Split the condition value into tokens
				tokens := strings.Fields(condition.Value.(string))
				for _, token := range tokens {
					query = query.Where(searchIndexField+"."+strings.ToLower(token), "==", true)
				}
				continue
			}

			fieldMetadata, err := collectionMetadata.GetField(condition.Field)
			if err != nil {
				return nil, err
			}
			fieldName, err := getDBFieldName(fieldMetadata)
			if err != nil {
				return nil, err
			}

			conditionValue, err := adapters.GetConditionValue(condition, wire, metadata, requests, responses)
			if err != nil {
				return nil, err
			}
			//TODO:: Needs to be added to other adapters eventually.
			if condition.Operator == "IN" {
				query = query.Where(fieldName, "in", conditionValue)
			} else {
				query = query.Where(fieldName, "==", conditionValue)
			}
		}
	}

	// Maps
	// ReferenceField -> id values needed
	data := []map[string]interface{}{}
	iter := query.Documents(ctx)
	defer iter.Stop()
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, errors.New("Failed to iterate:" + err.Error())
		}

		result := map[string]interface{}{}

		// Map properties from firestore to uesio fields
		for fieldID, fieldMetadata := range fieldMap {

			firestoreFieldName, err := getDBFieldName(fieldMetadata)
			if err != nil {
				return nil, err
			}
			fieldData, err := doc.DataAtPath([]string{firestoreFieldName})
			if err != nil {
				continue
			}
			result[fieldID] = fieldData

		}
		// Process reference Fields
		for _, reference := range referenceFields {
			fieldMetadata := reference.Metadata
			foreignKeyMetadata, err := collectionMetadata.GetField(fieldMetadata.ForeignKeyField)
			if err != nil {
				return nil, errors.New("foreign key: " + fieldMetadata.ForeignKeyField + " configured for: " + fieldMetadata.Name + " does not exist in collection: " + collectionMetadata.Name)
			}
			foreignKeyName, err := adapters.GetUIFieldName(foreignKeyMetadata)
			if err != nil {
				return nil, err
			}
			foreignKeyValue, ok := result[foreignKeyName]
			if !ok {
				//No foreign key value
				continue
			}

			reference.AddID(foreignKeyValue)
		}
		result[collectionMetadata.IDField] = doc.Ref.ID
		data = append(data, result)
	}
	//At this point idsToLookFor has a mapping for reference field
	//names to actual id values we will need to grab from the referenced collection
	if len(referenceFields) != 0 {
		//Attach extra data needed for reference fields
		err = followUpReferenceFieldLoad(ctx, client, metadata, data, collectionMetadata, referenceFields)
		if err != nil {
			return nil, err
		}
	}

	return &reqs.LoadResponse{
		Wire:       wire.Wire,
		Collection: wire.Collection,
		Data:       data,
	}, nil
}

// Load function
func (a *Adapter) Load(requests []reqs.LoadRequest, metadata *adapters.MetadataCache, credentials *creds.AdapterCredentials) ([]reqs.LoadResponse, error) {

	ctx := context.Background()
	responses := []reqs.LoadResponse{}

	// Get a Firestore client.
	client, err := getClient(credentials)
	if err != nil {
		return nil, errors.New("Failed to create or retrieve client:" + err.Error())
	}

	for _, wire := range requests {
		response, err := loadOne(ctx, client, wire, metadata, requests, responses)
		if err != nil {
			return nil, err
		}

		responses = append(responses, *response)
	}

	return responses, nil
}
