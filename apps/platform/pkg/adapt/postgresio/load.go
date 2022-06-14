package postgresio

import (
	"context"
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
		return "(main.fields->>'" + fieldName + "')::boolean"
	case "TIMESTAMP":
		return "(main.fields->>'" + fieldName + "')::bigint"
	case "NUMBER":
		return "main.fields->'" + fieldName + "'"
	case "MAP", "LIST", "MULTISELECT":
		// Return just as bytes
		return "main.fields->'" + fieldName + "'"
	default:
		// Cast to string
		return "main.fields->>'" + fieldName + "'"
	}
}

func (c *Connection) Load(op *adapt.LoadOp) error {

	metadata := c.metadata
	credentials := c.credentials
	userTokens := c.tokens
	db := c.GetClient()

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

	joins := []string{}

	paramCounter := NewParamCounter(2)

	conditionStrings, values, err := getConditions(op, metadata, collectionMetadata, credentials, paramCounter)
	if err != nil {
		return err
	}

	if collectionMetadata.Access == "protected" && userTokens != nil && op.SkipRecordSecurity == false {
		accessFieldID := "main.id"

		challengeMetadata := collectionMetadata
		currentTable := "main"

		for challengeMetadata.AccessField != "" {

			accessField := challengeMetadata.AccessField

			fieldMetadata, err := challengeMetadata.GetField(accessField)
			if err != nil {
				return err
			}
			challengeMetadata, err = metadata.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
			if err != nil {
				return err
			}

			tenantID := credentials.GetTenantIDForCollection(challengeMetadata.GetFullName())

			refCollectionName, err := getDBCollectionName(challengeMetadata, tenantID)
			if err != nil {
				return err
			}

			newTable := currentTable + "sub"

			joins = append(joins, "LEFT OUTER JOIN data as \""+newTable+"\" ON "+currentTable+".fields->>'"+accessField+"' = "+newTable+".fields->>'uesio/core.id' AND "+newTable+".collection = '"+refCollectionName+"'")

			accessFieldID = newTable + ".id"

			currentTable = newTable

		}

		conditionStrings = append(conditionStrings, "AND "+accessFieldID+" IN (SELECT fullid FROM public.tokens WHERE token = ANY("+paramCounter.get()+"))")
		values = append(values, userTokens)
	}

	loadQuery := "SELECT " +
		strings.Join(fieldIDs, ",") +
		" FROM data as \"main\" " +
		strings.Join(joins, " ") +
		" WHERE " +
		strings.Join(conditionStrings, " ")

	test := collectionMetadata.GetFullName()
	//|| test == "uesio/studio.field"
	if test == "uesio/crm.account" || test == "uesio/crm.contact" {
		println(loadQuery)
	}

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

	rows, err := db.Query(context.Background(), loadQuery, values...)
	if err != nil {
		return errors.New("Failed to load rows in PostgreSQL:" + err.Error() + " : " + loadQuery)
	}
	defer rows.Close()

	cols := rows.FieldDescriptions()
	if err != nil {
		return errors.New("Failed to load columns in PostgreSQL:" + err.Error())
	}

	var item loadable.Item
	index := 0
	scanners := make([]interface{}, len(cols))

	for i, col := range cols {
		scanners[i] = &DataScanner{
			Item:       &item,
			Field:      fieldMap[string(col.Name)],
			References: &referencedCollections,
		}
	}

	op.HasMoreBatches = false

	formulaPopulations := adapt.GetFormulaFunction(formulaFields)

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

		err = formulaPopulations(item)
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

	return adapt.HandleReferences(c, referencedCollections)
}
