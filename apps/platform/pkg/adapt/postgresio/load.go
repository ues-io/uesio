package postgresio

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

var DEBUG_SQL = os.Getenv("UESIO_DEBUG_SQL") == "true"

const (
	stabby     = "->"
	waffleCone = "#>"
)

func getFieldNameWithAlias(fieldMetadata *adapt.FieldMetadata) string {
	fieldName := getJSONBFieldName(fieldMetadata, "main")
	return fmt.Sprintf("'%s',%s", fieldMetadata.GetFullName(), fieldName)
}

func castFieldToText(fieldAlias string) string {
	return fmt.Sprintf("%s::text", fieldAlias)
}

func getIDFieldName(tableAlias string) string {
	return castFieldToText(getAliasedName("id", tableAlias))
}

func getJSONBFieldName(fieldMetadata *adapt.FieldMetadata, tableAlias string) string {
	fieldName := fieldMetadata.GetFullName()

	switch fieldName {
	case adapt.ID_FIELD:
		return getAliasedName("id", tableAlias)
	case adapt.UNIQUE_KEY_FIELD:
		return getAliasedName("uniquekey", tableAlias)
	case adapt.OWNER_FIELD:
		return getAliasedName("owner", tableAlias)
	case adapt.CREATED_BY_FIELD:
		return getAliasedName("createdby", tableAlias)
	case adapt.CREATED_AT_FIELD:
		return fmt.Sprintf("date_part('epoch',%s)", getAliasedName("createdat", tableAlias))
	case adapt.UPDATED_BY_FIELD:
		return getAliasedName("updatedby", tableAlias)
	case adapt.UPDATED_AT_FIELD:
		return fmt.Sprintf("date_part('epoch',%s)", getAliasedName("updatedat", tableAlias))
	case adapt.COLLECTION_FIELD:
		return getAliasedName("collection", tableAlias)
	}

	return fmt.Sprintf("%s%s'%s'", getAliasedName("fields", tableAlias), stabby, fieldName)

}

func getFieldNameString(fieldType string, fieldsField string, fieldName string) string {
	// If the fieldName includes a Uesio path indicator, then we need to use a Postgres JSON path array operator
	// (aka "Waffle Cone") instead of the "stabby" operator to deeply traverse
	traversalOperator := stabby
	useFieldName := fmt.Sprintf("'%s'", fieldName)
	if strings.Contains(fieldName, constant.RefSep) {
		traversalOperator = waffleCone
		useFieldName = fmt.Sprintf("Array['%s']", strings.Join(strings.Split(fieldName, constant.RefSep), "','"))
	}
	switch fieldType {
	case "CHECKBOX":
		return fmt.Sprintf("(%s%s>%s)::boolean", fieldsField, traversalOperator, useFieldName)
	case "TIMESTAMP":
		return fmt.Sprintf("(%s%s>%s)::bigint", fieldsField, traversalOperator, useFieldName)
	case "NUMBER", "MAP", "LIST", "MULTISELECT", "STRUCT":
		// Return just as bytes
		return fmt.Sprintf("%s%s%s", fieldsField, traversalOperator, useFieldName)
	default:
		// Cast to string
		return fmt.Sprintf("%s%s>%s", fieldsField, traversalOperator, useFieldName)
	}
}

func getFieldName(fieldMetadata *adapt.FieldMetadata, tableAlias string) string {
	fieldName := fieldMetadata.GetFullName()

	switch fieldName {
	case adapt.ID_FIELD:
		return getIDFieldName(tableAlias)
	case adapt.UNIQUE_KEY_FIELD:
		return getAliasedName("uniquekey", tableAlias)
	case adapt.OWNER_FIELD:
		return castFieldToText(getAliasedName("owner", tableAlias))
	case adapt.CREATED_BY_FIELD:
		return castFieldToText(getAliasedName("createdby", tableAlias))
	case adapt.CREATED_AT_FIELD:
		return fmt.Sprintf("date_part('epoch',%s)", getAliasedName("createdat", tableAlias))
	case adapt.UPDATED_BY_FIELD:
		return castFieldToText(getAliasedName("updatedby", tableAlias))
	case adapt.UPDATED_AT_FIELD:
		return fmt.Sprintf("date_part('epoch',%s)", getAliasedName("updatedat", tableAlias))
	case adapt.COLLECTION_FIELD:
		return getAliasedName("collection", tableAlias)
	}

	fieldsField := getAliasedName("fields", tableAlias)
	return getFieldNameString(fieldMetadata.Type, fieldsField, fieldName)
}

func getAliasedName(name, alias string) string {
	if alias == "" {
		return name
	}
	return fmt.Sprintf("%s.%s", alias, name)
}

func (c *Connection) Load(op *adapt.LoadOp, session *sess.Session) error {

	metadata := c.metadata
	userTokens := session.GetFlatTokens()
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

	err = processConditionListForTenant(op.Conditions, collectionMetadata, metadata, builder, "main", session)
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

			newTable := currentTable + "sub"

			accessFieldString := getFieldName(fieldMetadata, currentTable)
			idFieldString := getIDFieldName(newTable)

			subBuilder := builder.getSubBuilder("")
			addTenantConditions(challengeMetadata, metadata, subBuilder, newTable, session)

			joins = append(joins, fmt.Sprintf("LEFT OUTER JOIN data as \"%s\" ON %s = %s AND %s\n", newTable, accessFieldString, idFieldString, subBuilder.String()))

			accessFieldID = getAliasedName("id", newTable)

			currentTable = newTable

		}

		if op.RequireWriteAccess {
			builder.addQueryPart(fmt.Sprintf("%s IN (SELECT recordid FROM tokens WHERE token = ANY(%s) AND readonly != true)", accessFieldID, builder.addValue(userTokens)))
		} else if collectionMetadata.IsReadProtected() {
			builder.addQueryPart(fmt.Sprintf("%s IN (SELECT recordid FROM tokens WHERE token = ANY(%s))", accessFieldID, builder.addValue(userTokens)))
		}
	}

	loadQuery := "SELECT\n" +
		"jsonb_build_object(\n" +
		strings.Join(fieldIDs, ",\n") +
		"\n)" +
		"\nFROM data as \"main\"\n" +
		strings.Join(joins, "") +
		"WHERE\n" +
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
		loadQuery = loadQuery + "\nORDER BY " + strings.Join(orders, ",")
	}
	if op.BatchSize == 0 || op.BatchSize > adapt.MAX_LOAD_BATCH_SIZE {
		op.BatchSize = adapt.MAX_LOAD_BATCH_SIZE
	}
	loadQuery = loadQuery + "\nLIMIT " + strconv.Itoa(op.BatchSize+1)
	if op.BatchNumber != 0 {
		loadQuery = loadQuery + "\nOFFSET " + strconv.Itoa(op.BatchSize*op.BatchNumber)
	}

	if DEBUG_SQL {
		op.DebugQueryString = loadQuery
	}

	//start := time.Now()
	//fmt.Println(loadQuery)
	//fmt.Println(builder.Values)

	rows, err := db.Query(context.Background(), loadQuery, builder.Values...)
	if err != nil {
		return errors.New("Failed to load rows in PostgreSQL:" + err.Error() + " : " + loadQuery)
	}
	defer rows.Close()

	op.HasMoreBatches = false
	formulaPopulations := adapt.GetFormulaFunction(formulaFields, collectionMetadata)
	index := 0
	for rows.Next() {
		if op.BatchSize == index {
			op.HasMoreBatches = true
			break
		}

		item := op.Collection.NewItem()

		err := rows.Scan(item)
		if err != nil {
			return err
		}

		for _, refCol := range referencedCollections {
			for _, fieldMetadata := range refCol.RefFields {
				refObj, err := item.GetField(fieldMetadata.GetFullName())
				if err != nil {
					return err
				}
				refKey, err := adapt.GetReferenceKey(refObj)
				if err != nil {
					return err
				}
				refCol.AddID(refKey, adapt.ReferenceLocator{
					Item:  item,
					Field: fieldMetadata,
				})
			}
		}

		err = formulaPopulations(item)
		if err != nil {
			return err
		}

		err = op.Collection.AddItem(item)
		if err != nil {
			return err
		}

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
