package salesforce

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func getFieldName(fieldMetadata *adapt.FieldMetadata) string {
	return fieldMetadata.Name
}

func (c *Connection) Load(op *adapt.LoadOp) error {

	metadata := c.metadata
	client := c.client
	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}
	//TO-DO referencedGroupCollections do something with it
	fieldMap, referencedCollections, _, _, err := adapt.GetFieldsMap(op.Fields, collectionMetadata, metadata)
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
	if op.BatchSize == 0 || op.BatchSize > adapt.MAX_LOAD_BATCH_SIZE {
		op.BatchSize = adapt.MAX_LOAD_BATCH_SIZE
	}
	/*
		loadQuery = loadQuery + " limit " + strconv.Itoa(op.BatchSize+1)
		if op.BatchNumber != 0 {
			loadQuery = loadQuery + " offset " + strconv.Itoa(op.BatchSize*op.BatchNumber)
		}
	*/

	//fmt.Println(loadQuery)
	result, err := client.Query(loadQuery)
	if err != nil {
		return err
	}

	op.HasMoreBatches = false

	for i, record := range result.Records {
		if op.BatchSize == i {
			op.HasMoreBatches = true
			break
		}
		item := op.Collection.NewItem()
		for id, fieldmetadata := range fieldMap {
			item.SetField(id, record[fieldmetadata.ColumnName])
		}
	}

	op.BatchNumber++

	return adapt.HandleReferences(c, referencedCollections, op.SkipRecordSecurity)
}
