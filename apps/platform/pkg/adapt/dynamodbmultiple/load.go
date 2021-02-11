package dynamodbmultiple

import (
	"context"
	"errors"
	"fmt"
	"sort"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func loadOne(
	ctx context.Context,
	client *dynamodb.DynamoDB,
	op *adapt.LoadOp,
	metadata *adapt.MetadataCache,
	ops []adapt.LoadOp,
) error {

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	nameFieldMetadata, err := collectionMetadata.GetNameField()
	if err != nil {
		return err
	}

	nameFieldDB, err := getDBFieldName(nameFieldMetadata)
	if err != nil {
		return err
	}

	collectionName, err := getDBCollectionName(collectionMetadata)
	if err != nil {
		return err
	}

	fieldMap, referencedCollections, err := adapt.GetFieldsMap(op.Fields, collectionMetadata, metadata)
	if err != nil {
		return err
	}

	fieldIDs, err := fieldMap.GetUniqueDBFieldNames(getDBFieldName)
	if err != nil {
		return err
	}

	var projBuild expression.ProjectionBuilder
	var filt expression.ConditionBuilder
	searchQuery := false

	for _, name := range fieldIDs {
		projBuild = expression.AddNames(projBuild, expression.Name(name))
	}

	for i, condition := range op.Conditions {

		if condition.Type == "SEARCH" {
			searchToken := condition.Value.(string)
			searchQuery = true
			filt = expression.Name(nameFieldDB).Contains(searchToken)
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
			for i, id := range conditionValue.([]string) {
				if i == 0 {
					filt = expression.Name(fieldName).Equal(expression.Value(id))
				} else {
					filt = filt.Or(expression.Name(fieldName).Equal(expression.Value(id)))
				}
			}
		} else {
			if i == 0 {
				filt = expression.Name(fieldName).Equal(expression.Value(fmt.Sprintf("%v", conditionValue)))
			} else {
				filt = filt.And(expression.Name(fieldName).Equal(expression.Value(fmt.Sprintf("%v", conditionValue))))
			}
		}

	}

	mybuilder := expression.NewBuilder()
	mybuilder = mybuilder.WithProjection(projBuild)

	if len(op.Conditions) > 0 || searchQuery {
		mybuilder = mybuilder.WithFilter(filt)
	}

	expr, err := mybuilder.Build()

	if err != nil {
		return errors.New("DynamoDB failed to generate expression:" + err.Error())
	}

	params := &dynamodb.ScanInput{
		TableName:                 aws.String(collectionName),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
		FilterExpression:          expr.Filter(),
		ProjectionExpression:      expr.Projection(),
	}

	result, err := client.Scan(params)

	if err != nil {
		return errors.New("DynamoDB failed to make Query API call:" + err.Error())
	}

	for index, lmap := range result.Items {
		err = adapt.HydrateItem(op, collectionMetadata, &fieldMap, &referencedCollections, "", index, func(fieldMetadata *adapt.FieldMetadata) (interface{}, error) {
			var i interface{}

			dynamoFieldName, err := getDBFieldName(fieldMetadata)
			if err != nil {
				return nil, err
			}

			value, ok := lmap[dynamoFieldName]
			if !ok {
				return nil, nil
			}
			err = dynamodbattribute.Unmarshal(value, &i)
			if err != nil {
				return nil, err
			}
			return i, nil
		})
		if err != nil {
			return err
		}
	}

	err = adapt.HandleReferences(func(ops []adapt.LoadOp) error {
		return loadMany(ctx, client, ops, metadata)
	}, op.Collection, referencedCollections)
	if err != nil {
		return err
	}

	collSlice := op.Collection.GetItems()
	locLessFunc, ok := adapt.LessFunc(collSlice, op.Order)

	if ok {
		sort.Slice(collSlice, locLessFunc)
	}

	if op.Limit != 0 || op.Offset != 0 {
		err := adapt.ApplyLimitAndOffset(op)
		if err != nil {
			return err
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
	client, err := getDynamoDB(credentials)
	if err != nil {
		return err
	}
	return loadMany(ctx, client, ops, metadata)
}

func loadMany(
	ctx context.Context,
	client *dynamodb.DynamoDB,
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
