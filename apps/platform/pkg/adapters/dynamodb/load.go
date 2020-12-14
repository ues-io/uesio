package dynamodb

import (
	"context"
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/reqs"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

func loadOne(
	ctx context.Context,
	client *dynamodb.DynamoDB,
	wire reqs.LoadRequest,
	metadata *adapters.MetadataCache,
	requests []reqs.LoadRequest,
	responses []reqs.LoadResponse,
) (*reqs.LoadResponse, error) {

	collectionMetadata, err := metadata.GetCollection(wire.Collection)
	if err != nil {
		return nil, err
	}

	nameFieldMetadata, err := collectionMetadata.GetNameField()
	if err != nil {
		return nil, err
	}

	nameFieldDB, err := getDBFieldName(nameFieldMetadata)
	if err != nil {
		return nil, err
	}

	collectionName, err := getDBCollectionName(collectionMetadata)
	if err != nil {
		return nil, err
	}

	requestedFields, referenceCollection, err := adapters.GetFieldsMap(wire.Fields, collectionMetadata, metadata)
	if err != nil {
		return nil, err
	}

	var projBuild expression.ProjectionBuilder
	var filt expression.ConditionBuilder
	searchQuery := false

	for _, fieldMetadata := range requestedFields {
		dynamoFieldName, err := getDBFieldName(fieldMetadata)
		if err != nil {
			return nil, err
		}
		var NewName = expression.Name(dynamoFieldName)
		projBuild = expression.AddNames(projBuild, NewName)
	}

	if wire.Conditions != nil {

		for i, condition := range wire.Conditions {

			if condition.Type == "SEARCH" {
				searchToken := condition.Value.(string)
				searchQuery = true
				filt = expression.Name(nameFieldDB).Contains(searchToken)
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

			if i == 0 {
				filt = expression.Name(fieldName).Equal(expression.Value(fmt.Sprintf("%v", conditionValue)))
			} else {
				filt = filt.And(expression.Name(fieldName).Equal(expression.Value(fmt.Sprintf("%v", conditionValue))))
			}

		}
	}

	keyCond := expression.Key(SystemCollectionID).Equal(expression.Value(collectionName))
	mybuilder := expression.NewBuilder()
	mybuilder = mybuilder.WithKeyCondition(keyCond)
	mybuilder = mybuilder.WithProjection(projBuild)

	if len(wire.Conditions) > 0 || searchQuery {
		mybuilder = mybuilder.WithFilter(filt)
	}

	expr, err := mybuilder.Build()

	if err != nil {
		return nil, errors.New("DynamoDB failed to generate expression:" + err.Error())
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

	result, err := client.Query(params)

	if err != nil {
		return nil, errors.New("DynamoDB failed to make Query API call:" + err.Error())
	}

	data, err := manageResponse(result, requestedFields, referenceCollection, collectionMetadata)

	if err != nil {
		return nil, errors.New("DynamoDB failed manage response:" + err.Error())
	}

	//At this point idsToLookFor has a mapping for reference field
	//names to actual id values we will need to grab from the referenced collection
	if len(referenceCollection) != 0 {
		//Attach extra data needed for reference fields
		err = followUpReferenceFieldLoad(ctx, client, metadata, data, collectionMetadata, referenceCollection)
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
	client := getDynamoDB(credentials)

	if SystemSetUp != nil {
		return nil, SystemSetUp
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
