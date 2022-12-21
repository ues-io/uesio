package postgresio

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getFieldNameWithAlias(fieldMetadata *adapt.FieldMetadata) string {
	fieldName := getFieldName(fieldMetadata, "main")
	return fieldName + " AS \"" + fieldMetadata.GetFullName() + "\""
}

func getIDFieldName(tableAlias string) string {
	return fmt.Sprintf("%s::text", getAliasedName("id", tableAlias))
}

func getFieldName(fieldMetadata *adapt.FieldMetadata, tableAlias string) string {
	fieldName := fieldMetadata.GetFullName()
	if fieldName == adapt.ID_FIELD {
		return getIDFieldName(tableAlias)
	}
	if fieldName == adapt.UNIQUE_KEY_FIELD {
		return getAliasedName("uniquekey", tableAlias)
	}
	fieldsField := getAliasedName("fields", tableAlias)
	switch fieldMetadata.Type {
	case "CHECKBOX":
		return fmt.Sprintf("(%s->>'%s')::boolean", fieldsField, fieldName)
	case "TIMESTAMP":
		return fmt.Sprintf("(%s->>'%s')::bigint", fieldsField, fieldName)
	case "NUMBER":
		return fmt.Sprintf("%s->'%s'", fieldsField, fieldName)
	case "MAP", "LIST", "MULTISELECT":
		// Return just as bytes
		return fmt.Sprintf("%s->'%s'", fieldsField, fieldName)
	default:
		// Cast to string
		return fmt.Sprintf("%s->>'%s'", fieldsField, fieldName)
	}
}

func getAliasedName(name, alias string) string {
	if alias == "" {
		return name
	}
	return fmt.Sprintf("%s.%s", alias, name)
}

func (c *Connection) Load(op *adapt.LoadOp, session *sess.Session) error {

	metadata := c.metadata
	userTokens := session.GetTokens()
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

	builder := NewQueryBuilder()

	err = processConditionList(op.Conditions, collectionMetadata, metadata, builder, "main", session)
	if err != nil {
		return err
	}

	needsAccessCheck := collectionMetadata.IsReadProtected() || (collectionMetadata.IsWriteProtected() && op.RequireWriteAccess)

	userCanViewAllRecords := session.GetContextPermissions().ViewAllRecords

	if needsAccessCheck && userTokens != nil && userCanViewAllRecords == false {
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

			tenantID := session.GetTenantIDForCollection(challengeMetadata.GetFullName())

			refCollectionName := challengeMetadata.GetFullName()

			newTable := currentTable + "sub"

			accessFieldString := getFieldName(fieldMetadata, currentTable)
			idFieldString := getIDFieldName(newTable)

			newTableCollection := getAliasedName("collection", newTable)
			newTableTenant := getAliasedName("tenant", newTable)

			joins = append(joins, fmt.Sprintf("LEFT OUTER JOIN data as \"%s\" ON %s = %s AND %s = '%s' AND %s = '%s'", newTable, accessFieldString, idFieldString, newTableCollection, refCollectionName, newTableTenant, tenantID))

			accessFieldID = getAliasedName("id", newTable)

			currentTable = newTable

		}

		if op.RequireWriteAccess {
			builder.addQueryPart(fmt.Sprintf("%s IN (SELECT recordid FROM tokens WHERE token = ANY(%s) AND readonly != true)", accessFieldID, builder.addValue(userTokens)))
		} else if collectionMetadata.IsReadProtected() {
			builder.addQueryPart(fmt.Sprintf("%s IN (SELECT recordid FROM tokens WHERE token = ANY(%s))", accessFieldID, builder.addValue(userTokens)))
		}
	}

	loadQuery := "SELECT " +
		strings.Join(fieldIDs, ",") +
		" FROM data as \"main\" " +
		strings.Join(joins, " ") +
		" WHERE " +
		builder.String()

	orders := make([]string, len(op.Order))
	for i, order := range op.Order {
		fieldMetadata, err := collectionMetadata.GetField(order.Field)
		if err != nil {
			return err
		}
		fieldName := getFieldName(fieldMetadata, "main")
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

	//start := time.Now()
	//fmt.Println(loadQuery)
	//fmt.Println(builder.Values)

	rows, err := db.Query(context.Background(), loadQuery, builder.Values...)
	if err != nil {
		return errors.New("Failed to load rows in PostgreSQL:" + err.Error() + " : " + loadQuery)
	}
	defer rows.Close()

	cols := rows.FieldDescriptions()
	if err != nil {
		return errors.New("Failed to load columns in PostgreSQL:" + err.Error())
	}

	var item meta.Item
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
		op.Collection.AddItem(item)
		err := rows.Scan(scanners...)
		if err != nil {
			return err
		}

		formulaPopulations(item)
		//Ignore errors. if a formula cannot be evaluated, we should display the following records and not kill the execution
		//TO-DO find a way to display the errors in each record

		index++

	}
	err = rows.Err()
	if err != nil {
		return err
	}

	//fmt.Printf("PG LOAD %v %v\n", op.CollectionName, time.Since(start))

	op.BatchNumber++

	err = adapt.HandleReferencesGroup(c, op.Collection, referencedGroupCollections, session)
	if err != nil {
		return err
	}

	return adapt.HandleReferences(c, referencedCollections, session, true)
}
