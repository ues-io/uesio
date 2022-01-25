package salesforce

import (
	"errors"
	"strings"

	"github.com/simpleforce/simpleforce"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func getFieldName(fieldMetadata *adapt.FieldMetadata) string {
	return fieldMetadata.Name
}

func loadOne(
	client *simpleforce.Client,
	op *adapt.LoadOp,
	metadata *adapt.MetadataCache,
	ops []*adapt.LoadOp,
	tenantID string,
	userTokens []string,
) error {
	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	fieldMap, referencedCollections, err := adapt.GetFieldsMap(op.Fields, collectionMetadata, metadata)
	if err != nil {
		return err
	}

	fieldIDs, err := fieldMap.GetUniqueDBFieldNames(getFieldName)
	if err != nil {
		return err
	}

	loadQuery := "SELECT " + strings.Join(fieldIDs, ",") + " FROM " + collectionMetadata.TableName

	/*
		conditionStrings, values, err := getConditions(op, metadata, collectionMetadata, ops, tenantID, userTokens)
		if err != nil {
			return err
		}


		loadQuery = loadQuery + strings.Join(conditionStrings, " AND ")


		orders := make([]string, len(op.Order))
		for i, order := range op.Order {
			fieldMetadata, err := collectionMetadata.GetField(order.Field)
			if err != nil {
				return err
			}
			fieldName := getFieldName(fieldMetadata)
			if err != nil {
				return err
			}
			if order.Desc {
				orders[i] = fieldName + " desc"
				continue
			}
			orders[i] = fieldName + " asc"
		}

		if len(op.Order) > 0 {
			loadQuery = loadQuery + " order by " + strings.Join(orders, ",")
		}
	*/
	if op.BatchSize == 0 || op.BatchSize > adapt.MAX_BATCH_SIZE {
		op.BatchSize = adapt.MAX_BATCH_SIZE
	}
	/*
		loadQuery = loadQuery + " limit " + strconv.Itoa(op.BatchSize+1)
		if op.BatchNumber != 0 {
			loadQuery = loadQuery + " offset " + strconv.Itoa(op.BatchSize*op.BatchNumber)
		}
	*/

	//fmt.Println(loadQuery)
	result, err := client.Query(loadQuery) // Note: for Tooling API, use client.Tooling().Query(q)
	if err != nil {
		return err
	}

	for _, record := range result.Records {
		// access the record as SObjects.
		//fmt.Println(record)
		item := op.Collection.NewItem()
		for id, fieldmetadata := range fieldMap {
			item.SetField(id, record[fieldmetadata.ColumnName])
		}
	}

	index := 0
	// Check to see if we loaded in a full amount
	if index == op.BatchSize+1 {
		op.HasMoreBatches = true
		// Remove the last item
		op.Collection.Slice(0, op.BatchSize)
	} else {
		op.HasMoreBatches = false
	}

	op.BatchNumber++

	return adapt.HandleReferences(func(ops []*adapt.LoadOp) error {
		return loadMany(client, ops, metadata, tenantID, userTokens)
	}, op.Collection, referencedCollections)
}

// Load function
func (a *Adapter) Load(ops []*adapt.LoadOp, metadata *adapt.MetadataCache, credentials *adapt.Credentials, userTokens []string) error {

	if len(ops) == 0 {
		return nil
	}

	client, err := connect(credentials)
	if err != nil {
		return errors.New("Failed to connect Salesforce:" + err.Error())
	}

	return loadMany(client, ops, metadata, credentials.GetTenantID(), userTokens)
}

func loadMany(
	client *simpleforce.Client,
	ops []*adapt.LoadOp,
	metadata *adapt.MetadataCache,
	tenantID string,
	userTokens []string,
) error {
	for i := range ops {
		err := loadOne(client, ops[i], metadata, ops, tenantID, userTokens)
		if err != nil {
			return err
		}
	}
	return nil
}
