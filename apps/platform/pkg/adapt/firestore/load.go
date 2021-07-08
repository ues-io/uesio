package firestore

import (
	"context"
	"errors"
	"sort"
	"strings"

	"cloud.google.com/go/firestore"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"google.golang.org/api/iterator"
)

func loadOne(
	ctx context.Context,
	client *firestore.Client,
	op *adapt.LoadOp,
	metadata *adapt.MetadataCache,
	ops []adapt.LoadOp,
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

	fieldMap, referencedCollections, err := adapt.GetFieldsMap(op.Fields, collectionMetadata, metadata)
	if err != nil {
		return err
	}

	fieldIDs, err := fieldMap.GetUniqueDBFieldNames(getDBFieldName)
	if err != nil {
		return err
	}

	query = collection.Select(fieldIDs...)

	for _, condition := range op.Conditions {

		if condition.Type == "SEARCH" {
			// Split the condition value into tokens
			tokens := strings.Fields(condition.Value.(string))
			for _, token := range tokens {
				query = query.WherePath(firestore.FieldPath{searchIndexField, strings.ToLower(token)}, "==", true)
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

		conditionValue, err := adapt.GetConditionValue(condition, op, metadata, ops)
		if err != nil {
			return err
		}

		if condition.Operator == "IN" {
			query = query.Where(fieldName, "in", conditionValue)
		} else {
			query = query.Where(fieldName, "==", conditionValue)
		}
	}

	//Check if we can use firebase for order/limit/offset
	useNativeOrdering := true
	if len(op.Order) > 0 && len(op.Conditions) > 0 {
		useNativeOrdering = false
		//TO-DO display a warning (this query may not be optimized for this data adapter)
	}

	if useNativeOrdering {
		for _, order := range op.Order {

			fieldMetadata, err := collectionMetadata.GetField(order.Field)
			if err != nil {
				return err
			}
			fieldName, err := getDBFieldName(fieldMetadata)
			if err != nil {
				return err
			}

			lorder := firestore.Asc

			if order.Desc {
				lorder = firestore.Desc
			}

			query = query.OrderBy(fieldName, lorder)

		}

		if op.Offset != 0 {
			query = query.Offset(op.Offset)
		}

		if op.Limit != 0 {
			query = query.Limit(op.Limit)
		}
	}

	index := 0
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

		err = adapt.HydrateItem(op, collectionMetadata, &fieldMap, &referencedCollections, doc.Ref.ID, index, func(fieldMetadata *adapt.FieldMetadata) (interface{}, error) {
			firestoreFieldName, err := getDBFieldName(fieldMetadata)
			if err != nil {
				return nil, err
			}
			return doc.DataAtPath([]string{firestoreFieldName})
		})
		if err != nil {
			return err
		}
		index++
	}

	err = adapt.HandleReferences(func(ops []adapt.LoadOp) error {
		return loadMany(ctx, client, ops, metadata)
	}, op.Collection, referencedCollections)
	if err != nil {
		return err
	}

	if !useNativeOrdering {
		collSlice := op.Collection.GetItems()
		locLessFunc, ok := adapt.LessFunc(op.Collection, op.Order)
		if ok {
			sort.Slice(collSlice, locLessFunc)
		}

		if op.Limit != 0 || op.Offset != 0 {
			err := adapt.ApplyLimitAndOffset(op)
			if err != nil {
				return err
			}
		}

	}

	return nil
}

// Load function
func (a *Adapter) Load(ops []adapt.LoadOp, metadata *adapt.MetadataCache, credentials *adapt.Credentials) error {

	if len(ops) == 0 {
		return nil
	}

	ctx := context.Background()

	// Get a Firestore client.
	client, err := getClient(credentials)
	if err != nil {
		return errors.New("Failed to create or retrieve client:" + err.Error())
	}

	return loadMany(ctx, client, ops, metadata)
}

func loadMany(
	ctx context.Context,
	client *firestore.Client,
	ops []adapt.LoadOp,
	metadata *adapt.MetadataCache,
) error {
	for i := range ops {
		err := loadOne(ctx, client, &ops[i], metadata, ops)
		if err != nil {
			return err
		}
	}
	return nil
}
