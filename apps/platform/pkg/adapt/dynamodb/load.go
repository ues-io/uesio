package dynamodb

import (
	"context"
	"errors"
	"fmt"
	"sort"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// This is soooooo dumb, but they dynamodb api forces us to write silly code.
// At least I can't think of a better way. --- BH
func makeAndConditionBuilder(conditions []expression.ConditionBuilder) expression.ConditionBuilder {
	var emptyFilt expression.ConditionBuilder
	if len(conditions) == 0 {
		return emptyFilt
	} else if len(conditions) == 1 {
		return conditions[0]
	} else if len(conditions) == 2 {
		return expression.And(conditions[0], conditions[1])
	}
	return expression.And(conditions[0], conditions[1], conditions[2:]...)
}

// This is soooooo dumb, but they dynamodb api forces us to write silly code.
// At least I can't think of a better way. --- BH
func makeInConditionBuilder(fieldName string, values []string) expression.ConditionBuilder {
	if len(values) == 0 {
		return expression.In(expression.Name(fieldName), expression.Value(""))
	} else if len(values) == 1 {
		return expression.In(expression.Name(fieldName), expression.Value(values[0]))
	}
	operands := []expression.OperandBuilder{}
	for _, value := range values {
		operands = append(operands, expression.Value(value))
	}
	return expression.In(expression.Name(fieldName), operands[0], operands[1:]...)
}

func loadOne(
	ctx context.Context,
	client *dynamodb.Client,
	op *adapt.LoadOp,
	metadata *adapt.MetadataCache,
	ops []adapt.LoadOp,
	tenantID string,
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

	collectionName, err := getDBCollectionName(collectionMetadata, tenantID)
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
	searchQuery := false

	for _, name := range fieldIDs {
		projBuild = expression.AddNames(projBuild, expression.Name(name))
	}

	dynamoConditions := []expression.ConditionBuilder{}

	for _, condition := range op.Conditions {

		var dynamoCondition expression.ConditionBuilder

		if condition.Type == "SEARCH" {
			searchToken := condition.Value.(string)
			searchQuery = true
			dynamoCondition = expression.Name(nameFieldDB).Contains(searchToken)
			dynamoConditions = append(dynamoConditions, dynamoCondition)
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
			// Cast conditionValue to array
			valueArray := conditionValue.([]string)
			dynamoCondition = makeInConditionBuilder(fieldName, valueArray)
		} else {
			dynamoCondition = expression.Name(fieldName).Equal(expression.Value(fmt.Sprintf("%v", conditionValue)))
		}

		dynamoConditions = append(dynamoConditions, dynamoCondition)

	}

	filt := makeAndConditionBuilder(dynamoConditions)

	keyCond := expression.Key(SystemCollectionID).Equal(expression.Value(collectionName))
	mybuilder := expression.NewBuilder()
	mybuilder = mybuilder.WithKeyCondition(keyCond)
	mybuilder = mybuilder.WithProjection(projBuild)

	if len(op.Conditions) > 0 || searchQuery {
		mybuilder = mybuilder.WithFilter(filt)
	}

	expr, err := mybuilder.Build()

	if err != nil {
		return errors.New("DynamoDB failed to generate expression:" + err.Error())
	}

	params := &dynamodb.QueryInput{
		KeyConditionExpression:    expr.KeyCondition(),
		IndexName:                 aws.String(SystemIndex),
		TableName:                 aws.String(SystemTable),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
		FilterExpression:          expr.Filter(),
		ProjectionExpression:      expr.Projection(),
	}

	result, err := client.Query(ctx, params)

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
				return nil, errors.New("not found error")
			}
			err = attributevalue.Unmarshal(value, &i)
			if err != nil {
				return nil, err
			}
			if fieldMetadata.Type == "TIMESTAMP" {
				return int64(i.(float64)), nil
			}
			return i, nil
		})
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
	return loadMany(ctx, client, ops, metadata, credentials.GetTenantID())
}

func loadMany(
	ctx context.Context,
	client *dynamodb.Client,
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
