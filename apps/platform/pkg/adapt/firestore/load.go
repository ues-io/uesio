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

func getQueryFromOp(
	collection *firestore.CollectionRef,
	op *adapt.LoadOp,
	fieldMap adapt.FieldsMap,
	collectionMetadata *adapt.CollectionMetadata,
	metadata *adapt.MetadataCache,
	ops []adapt.LoadOp,
	useNativeOrdering bool,
) (*firestore.Query, error) {
	fieldIDs, err := fieldMap.GetUniqueDBFieldNames(getDBFieldName)
	if err != nil {
		return nil, err
	}
	query := collection.Select(fieldIDs...)
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
			return nil, err
		}
		fieldName, err := getDBFieldName(fieldMetadata)
		if err != nil {
			return nil, err
		}

		conditionValue, err := adapt.GetConditionValue(condition, op, metadata, ops)
		if err != nil {
			return nil, err
		}

		if condition.Operator == "IN" {
			query = query.Where(fieldName, "in", conditionValue)
		} else {
			query = query.Where(fieldName, "==", conditionValue)
		}
	}

	if useNativeOrdering {
		for _, order := range op.Order {

			fieldMetadata, err := collectionMetadata.GetField(order.Field)
			if err != nil {
				return nil, err
			}
			fieldName, err := getDBFieldName(fieldMetadata)
			if err != nil {
				return nil, err
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

	return &query, nil
}

func loadOne(
	ctx context.Context,
	client *firestore.Client,
	op *adapt.LoadOp,
	metadata *adapt.MetadataCache,
	ops []adapt.LoadOp,
	tenantID string,
) error {

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	collectionName, err := getDBCollectionName(collectionMetadata, tenantID)
	if err != nil {
		return err
	}

	collection := client.Collection(collectionName)

	fieldMap, referencedCollections, err := adapt.GetFieldsMap(op.Fields, collectionMetadata, metadata)
	if err != nil {
		return err
	}

	//Check if we can use firebase for order/limit/offset
	useNativeOrdering := true
	if len(op.Order) > 0 && len(op.Conditions) > 0 {
		useNativeOrdering = false
		//TO-DO display a warning (this query may not be optimized for this data adapter)
	}

	// Optimize for a straight up ids query
	var useGetAllOptimization *adapt.LoadRequestCondition
	if len(op.Conditions) == 1 && op.Conditions[0].Operator == "IN" && op.Conditions[0].Field == collectionMetadata.IDField {
		useGetAllOptimization = &op.Conditions[0]
		useNativeOrdering = false
	}

	hydrateFunc := func(snap *firestore.DocumentSnapshot, index int) error {
		return adapt.HydrateItem(op, collectionMetadata, &fieldMap, &referencedCollections, snap.Ref.ID, index, func(fieldMetadata *adapt.FieldMetadata) (interface{}, error) {
			firestoreFieldName, err := getDBFieldName(fieldMetadata)
			if err != nil {
				return nil, err
			}
			return snap.DataAtPath([]string{firestoreFieldName})
		})
	}

	getAllOptimizationFunc := func() error {
		var drs []*firestore.DocumentRef
		values := useGetAllOptimization.Value.([]string)
		for _, id := range values {
			drs = append(drs, collection.Doc(id))
		}
		docsnaps, err := client.GetAll(ctx, drs)
		if err != nil {
			return errors.New("Failed to iterate:" + err.Error())
		}
		for index, snap := range docsnaps {
			if !snap.Exists() {
				continue
			}
			err = hydrateFunc(snap, index)
			if err != nil {
				return err
			}
		}
		return nil
	}

	standardQueryFunc := func() error {
		query, err := getQueryFromOp(collection, op, fieldMap, collectionMetadata, metadata, ops, useNativeOrdering)
		if err != nil {
			return err
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

			err = hydrateFunc(doc, index)
			if err != nil {
				return err
			}
			index++
		}
		return nil
	}

	if useGetAllOptimization != nil {
		err := getAllOptimizationFunc()
		if err != nil {
			return err
		}
	} else {
		err := standardQueryFunc()
		if err != nil {
			return err
		}
	}

	err = adapt.HandleReferences(func(ops []adapt.LoadOp) error {
		return loadMany(ctx, client, ops, metadata, tenantID)
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

	return loadMany(ctx, client, ops, metadata, credentials.GetTenantID())
}

func loadMany(
	ctx context.Context,
	client *firestore.Client,
	ops []adapt.LoadOp,
	metadata *adapt.MetadataCache,
	tenantID string,
) error {
	for i := range ops {
		err := loadOne(ctx, client, &ops[i], metadata, ops, tenantID)
		if err != nil {
			return err
		}
	}
	return nil
}
