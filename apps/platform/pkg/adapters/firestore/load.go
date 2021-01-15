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
	op *adapters.LoadOp,
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

	fieldMap, referencedCollections, err := adapters.GetFieldsMap(op.Fields, collectionMetadata, metadata)
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

		err = hydrateItem(doc, op, collectionMetadata, fieldMap, referencedCollections)
		if err != nil {
			return err
		}
	}

	return adapters.HandleReferences(func(op *adapters.LoadOp, metadata *adapters.MetadataCache) error {
		return loadOne(ctx, client, op, metadata, nil)
	}, op, metadata, referencedCollections)
}

func hydrateItem(
	doc *firestore.DocumentSnapshot,
	op *adapters.LoadOp,
	collectionMetadata *adapters.CollectionMetadata,
	fieldMap adapters.FieldsMap,
	referencedCollections adapters.ReferenceRegistry,
) error {

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

		if fieldMetadata.IsForeignKey {
			// Handle foreign key value
			reference, ok := referencedCollections[fieldMetadata.ReferencedCollection]
			if ok {
				reference.AddID(fieldData)
			}
		}
	}

	err := item.SetField(collectionMetadata.IDField, doc.Ref.ID)
	if err != nil {
		return err
	}
	op.Collection.AddItem(item)
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

	for i := range ops {
		op := ops[i]
		err := loadOne(ctx, client, &op, metadata, ops)
		if err != nil {
			return err
		}
	}

	return nil
}
