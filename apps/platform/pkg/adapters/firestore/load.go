package firestore

import (
	"context"
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/creds"

	"cloud.google.com/go/firestore"
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"google.golang.org/api/iterator"
)

func loadOne(
	ctx context.Context,
	client *firestore.Client,
	op adapters.LoadOp,
	metadata *adapters.MetadataCache,
	ops []adapters.LoadOp,
) error {

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	collectionName, err := getDBCollectionName(collectionMetadata)
	if err != nil {
		return err
	}

	collection := client.Collection(collectionName)
	var query firestore.Query

	fieldMap, referenceFields, err := adapters.GetFieldsMap(op.Fields, collectionMetadata, metadata)
	if err != nil {
		return err
	}

	fieldIDs := []string{}

	for _, fieldMetadata := range fieldMap {
		firestoreFieldName, err := getDBFieldName(fieldMetadata)
		if err != nil {
			return err
		}
		fieldIDs = append(fieldIDs, firestoreFieldName)
	}

	if len(fieldIDs) == 0 {
		return errors.New("No fields selected")
	}
	query = collection.Select(fieldIDs...)

	for _, condition := range op.Conditions {

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
			return err
		}
		fieldName, err := getDBFieldName(fieldMetadata)
		if err != nil {
			return err
		}

		conditionValue, err := adapters.GetConditionValue(condition, op, metadata, ops)
		if err != nil {
			return err
		}
		//TODO:: Needs to be added to other adapters eventually.
		if condition.Operator == "IN" {
			query = query.Where(fieldName, "in", conditionValue)
		} else {
			query = query.Where(fieldName, "==", conditionValue)
		}
	}

	// Maps
	// ReferenceField -> id values needed
	iter := query.Documents(ctx)
	defer iter.Stop()
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return errors.New("Failed to iterate:" + err.Error())
		}

		item := op.Collection.NewItem()

		// Map properties from firestore to uesio fields
		for fieldID, fieldMetadata := range fieldMap {

			firestoreFieldName, err := getDBFieldName(fieldMetadata)
			if err != nil {
				return err
			}
			fieldData, err := doc.DataAtPath([]string{firestoreFieldName})
			if err != nil {
				continue
			}
			err = item.SetField(fieldID, fieldData)
			if err != nil {
				return err
			}
		}

		// Process reference Fields
		for _, reference := range referenceFields {

			fieldMetadata := reference.Metadata
			foreignKeyMetadata, err := collectionMetadata.GetField(fieldMetadata.ForeignKeyField)
			if err != nil {
				return errors.New("foreign key: " + fieldMetadata.ForeignKeyField + " configured for: " + fieldMetadata.Name + " does not exist in collection: " + collectionMetadata.Name)
			}
			foreignKeyName, err := adapters.GetUIFieldName(foreignKeyMetadata)
			if err != nil {
				return err
			}
			foreignKeyValue, err := item.GetField(foreignKeyName)
			if err != nil {
				//No foreign key value
				continue
			}

			reference.AddID(foreignKeyValue)
		}

		err = item.SetField(collectionMetadata.IDField, doc.Ref.ID)
		if err != nil {
			return err
		}
		op.Collection.AddItem(item)
	}
	//At this point idsToLookFor has a mapping for reference field
	//names to actual id values we will need to grab from the referenced collection

	op.Collection.Sort(op.Order, collectionMetadata)

	if len(referenceFields) != 0 {
		//Attach extra data needed for reference fields
		err = followUpReferenceFieldLoad(ctx, client, metadata, op, collectionMetadata, referenceFields)
		if err != nil {
			return err
		}
	}

	return nil
}

// Load function
func (a *Adapter) Load(ops []adapters.LoadOp, metadata *adapters.MetadataCache, credentials *creds.AdapterCredentials) error {

	ctx := context.Background()

	// Get a Firestore client.
	client, err := getClient(credentials)
	if err != nil {
		return errors.New("Failed to create or retrieve client:" + err.Error())
	}

	for _, op := range ops {
		err := loadOne(ctx, client, op, metadata, ops)
		if err != nil {
			return err
		}
	}

	return nil
}
