package postgresio

import (
	"errors"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

func getFieldNameWithAlias(fieldMetadata *adapt.FieldMetadata) string {
	fieldName := getFieldName(fieldMetadata)
	return fieldName + " AS \"" + fieldMetadata.GetFullName() + "\""
}

func getFieldName(fieldMetadata *adapt.FieldMetadata) string {
	fieldName := fieldMetadata.GetFullName()
	switch fieldMetadata.Type {
	case "CHECKBOX":
		return "(fields->>'" + fieldName + "')::boolean"
	case "TIMESTAMP":
		return "(fields->>'" + fieldName + "')::bigint"
	case "NUMBER":
		return "(fields->>'" + fieldName + "')::numeric"
	case "MAP", "LIST", "MULTISELECT":
		// Return just as bytes
		return "fields->'" + fieldName + "'"
	default:
		// Cast to string
		return "fields->>'" + fieldName + "'"
	}
}

func (c *Connection) Load(op *adapt.LoadOp) error {

	metadata := c.metadata
	credentials := c.credentials
	userTokens := c.tokens
	db := c.client

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	fieldMap, referencedCollections, referencedGroupCollections, formulaFields, err := adapt.GetFieldsMap(op.Fields, collectionMetadata, metadata)
	if err != nil {
		return err
	}

	fieldIDs, err := fieldMap.GetUniqueDBFieldNames(getFieldNameWithAlias)
	if err != nil {
		return err
	}

	loadQuery := "SELECT " + strings.Join(fieldIDs, ",") + " FROM public.data WHERE "

	conditionStrings, values, err := getConditions(op, metadata, collectionMetadata, credentials, userTokens)
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
	if op.BatchSize == 0 || op.BatchSize > adapt.MAX_LOAD_BATCH_SIZE {
		op.BatchSize = adapt.MAX_LOAD_BATCH_SIZE
	}
	loadQuery = loadQuery + " limit " + strconv.Itoa(op.BatchSize+1)
	if op.BatchNumber != 0 {
		loadQuery = loadQuery + " offset " + strconv.Itoa(op.BatchSize*op.BatchNumber)
	}

	rows, err := db.Query(loadQuery, values...)
	if err != nil {
		return errors.New("Failed to load rows in PostgreSQL:" + err.Error() + " : " + loadQuery)
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return errors.New("Failed to load columns in PostgreSQL:" + err.Error())
	}

	var item loadable.Item
	index := 0
	scanners := make([]interface{}, len(cols))

	for i, name := range cols {
		scanners[i] = &DataScanner{
			Item:       &item,
			Field:      fieldMap[name],
			References: &referencedCollections,
			Index:      &index,
		}
	}

	op.HasMoreBatches = false

	for rows.Next() {
		if op.BatchSize == index {
			op.HasMoreBatches = true
			break
		}

		item = op.Collection.NewItem()
		err := rows.Scan(scanners...)
		if err != nil {
			return err
		}

		err = adapt.HandleFormulaFields(formulaFields, collectionMetadata, item)
		if err != nil {
			return err
		}

		index++

	}
	err = rows.Err()
	if err != nil {
		return err
	}

	op.BatchNumber++

	err = adapt.HandleReferencesGroup(c, op.Collection, referencedGroupCollections)
	if err != nil {
		return err
	}

	return adapt.HandleReferences(c, op.Collection, referencedCollections)
}
