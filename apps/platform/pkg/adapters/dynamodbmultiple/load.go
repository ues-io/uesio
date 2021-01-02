package dynamodbmultiple

import (
	"context"
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/creds"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

func loadOne(
	ctx context.Context,
	client *dynamodb.DynamoDB,
	op adapters.LoadOp,
	metadata *adapters.MetadataCache,
	ops []adapters.LoadOp,
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

	requestedFields, referenceCollection, err := adapters.GetFieldsMap(op.Fields, collectionMetadata, metadata)
	if err != nil {
		return err
	}

	var projBuild expression.ProjectionBuilder
	var filt expression.ConditionBuilder
	searchQuery := false

	for _, fieldMetadata := range requestedFields {
		dynamoFieldName, err := getDBFieldName(fieldMetadata)
		if err != nil {
			return err
		}
		var NewName = expression.Name(dynamoFieldName)
		projBuild = expression.AddNames(projBuild, NewName)
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
		conditionValue, err := adapters.GetConditionValue(condition, op, metadata, ops)
		if err != nil {
			return err
		}

		if i == 0 {
			filt = expression.Name(fieldName).Equal(expression.Value(fmt.Sprintf("%v", conditionValue)))
		} else {
			filt = filt.And(expression.Name(fieldName).Equal(expression.Value(fmt.Sprintf("%v", conditionValue))))
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

	for _, lmap := range result.Items {

		item := op.Collection.NewItem()

		// Map properties from firestore to uesio fields
		for _, fieldMetadata := range requestedFields {

			var i interface{}

			fieldID, err := adapters.GetUIFieldName(fieldMetadata)
			if err != nil {
				return err
			}

			dynamoFieldName, err := getDBFieldName(fieldMetadata)
			if err != nil {
				return err
			}

			value, ok := lmap[dynamoFieldName]
			if !ok {
				continue
			}
			dynamodbattribute.Unmarshal(value, &i)
			err = item.SetField(fieldID, i)
			if err != nil {
				return err
			}
		}

		for _, reference := range referenceCollection {
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
		op.Collection.AddItem(item)
	}

	if err != nil {
		return errors.New("DynamoDB failed manage response:" + err.Error())
	}

	//At this point idsToLookFor has a mapping for reference field
	//names to actual id values we will need to grab from the referenced collection
	if len(referenceCollection) != 0 {
		//Attach extra data needed for reference fields
		err = followUpReferenceFieldLoad(ctx, client, metadata, op, collectionMetadata, referenceCollection)
		if err != nil {
			return err
		}
	}

	return nil
}

// Load function
func (a *Adapter) Load(ops []adapters.LoadOp, metadata *adapters.MetadataCache, credentials *creds.AdapterCredentials) error {

	ctx := context.Background()
	client := getDynamoDB(credentials)

	for _, op := range ops {
		err := loadOne(ctx, client, op, metadata, ops)
		if err != nil {
			return err
		}
	}

	return nil
}
