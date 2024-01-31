package postgresio

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"sync/atomic"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/formula"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

// Only used if DEBUG_SQL is enabled - does some counts of SQL queries made
// so that we can analyze whether performance optimizations are moving us up/down
// in numbers of total queries.
var totalWorkspaceQueries atomic.Int64
var totalQueries atomic.Int64

var debugSQL = os.Getenv("UESIO_DEBUG_SQL") == "true"

func init() {
	if env.InDevMode() {
		totalWorkspaceQueries = atomic.Int64{}
		totalQueries = atomic.Int64{}
	}
}

type QueryStatistics struct {
	TotalWorkspaceQueries int64 `json:"totalWorkspaceQueries"`
	TotalQueries          int64 `json:"totalQueries"`
}

func GetQueryStatistics() QueryStatistics {
	return QueryStatistics{
		TotalWorkspaceQueries: totalWorkspaceQueries.Load(),
		TotalQueries:          totalQueries.Load(),
	}
}

func ResetQueryStatistics() {
	totalWorkspaceQueries.Store(0)
	totalQueries.Store(0)
}

const (
	stabby     = "->"
	waffleCone = "#>"
)

func getFieldNameWithAlias(fieldMetadata *wire.FieldMetadata) string {
	fieldName := getJSONBFieldName(fieldMetadata, "main")
	return fmt.Sprintf("'%s',%s", fieldMetadata.GetFullName(), fieldName)
}

func castFieldToText(fieldAlias string) string {
	return fmt.Sprintf("%s::text", fieldAlias)
}

func getIDFieldName(tableAlias string) string {
	return castFieldToText(getAliasedName("id", tableAlias))
}

func getJSONBFieldName(fieldMetadata *wire.FieldMetadata, tableAlias string) string {
	fieldName := fieldMetadata.GetFullName()

	switch fieldName {
	case commonfields.Id:
		return getAliasedName("id", tableAlias)
	case commonfields.UniqueKey:
		return getAliasedName("uniquekey", tableAlias)
	case commonfields.Owner:
		return getAliasedName("owner", tableAlias)
	case commonfields.CreatedBy:
		return getAliasedName("createdby", tableAlias)
	case commonfields.CreatedAt:
		return fmt.Sprintf("date_part('epoch',%s)", getAliasedName("createdat", tableAlias))
	case commonfields.UpdatedBy:
		return getAliasedName("updatedby", tableAlias)
	case commonfields.UpdatedAt:
		return fmt.Sprintf("date_part('epoch',%s)", getAliasedName("updatedat", tableAlias))
	case commonfields.Collection:
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

func getFieldName(fieldMetadata *wire.FieldMetadata, tableAlias string) string {
	fieldName := fieldMetadata.GetFullName()

	switch fieldName {
	case commonfields.Id:
		return getIDFieldName(tableAlias)
	case commonfields.UniqueKey:
		return getAliasedName("uniquekey", tableAlias)
	case commonfields.Owner:
		return castFieldToText(getAliasedName("owner", tableAlias))
	case commonfields.CreatedBy:
		return castFieldToText(getAliasedName("createdby", tableAlias))
	case commonfields.CreatedAt:
		return fmt.Sprintf("date_part('epoch',%s)", getAliasedName("createdat", tableAlias))
	case commonfields.UpdatedBy:
		return castFieldToText(getAliasedName("updatedby", tableAlias))
	case commonfields.UpdatedAt:
		return fmt.Sprintf("date_part('epoch',%s)", getAliasedName("updatedat", tableAlias))
	case commonfields.Collection:
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

func (c *Connection) Load(op *wire.LoadOp, session *sess.Session) error {

	metadata := c.metadata
	userTokens := session.GetFlatTokens()
	db := c.GetClient()

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	fieldMap, referencedCollections, referencedGroupCollections, formulaFields, err := wire.GetFieldsMap(op.Fields, collectionMetadata, metadata)
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
			challengeMetadata, err = metadata.GetCollection(fieldMetadata.ReferenceMetadata.GetCollection())
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

	var orders []string
	for i := range op.Order {
		order := op.Order[i]
		fieldMetadata, err := collectionMetadata.GetField(order.Field)
		if err != nil {
			return err
		}
		fieldName := getFieldName(fieldMetadata, "main")
		if err != nil {
			return err
		}
		dir := "asc"
		if order.Desc {
			dir = "desc"
		}
		orders = append(orders, fieldName+" "+dir)
	}

	if len(orders) > 0 {
		loadQuery = loadQuery + "\nORDER BY " + strings.Join(orders, ",")
	}
	if op.BatchSize == 0 || op.BatchSize > adapt.MAX_LOAD_BATCH_SIZE {
		op.BatchSize = adapt.MAX_LOAD_BATCH_SIZE
	}
	loadQuery = loadQuery + "\nLIMIT " + strconv.Itoa(op.BatchSize+1)
	if op.BatchNumber != 0 {
		loadQuery = loadQuery + "\nOFFSET " + strconv.Itoa(op.BatchSize*op.BatchNumber)
	}

	if debugSQL {
		op.DebugQueryString = loadQuery
	}

	//start := time.Now()
	//fmt.Println(loadQuery)
	//fmt.Println(builder.Values)

	rows, err := db.Query(c.ctx, loadQuery, builder.Values...)
	if err != nil {
		return TranslatePGError(err)
	}
	defer rows.Close()

	op.HasMoreBatches = false
	formulaPopulations := formula.GetFormulaFunction(c.ctx, formulaFields, collectionMetadata)
	index := 0
	for rows.Next() {
		if op.BatchSize == index {
			op.HasMoreBatches = true
			break
		}

		item := op.Collection.NewItem()

		err := rows.Scan(item)
		if err != nil {
			return TranslatePGError(err)
		}

		for _, refCol := range referencedCollections {
			for _, fieldMetadata := range refCol.RefFields {
				refObj, err := item.GetField(fieldMetadata.GetFullName())
				if err != nil {
					return err
				}
				if refObj == nil {
					continue
				}
				refKey, err := wire.GetReferenceKey(refObj)
				if err != nil {
					return err
				}
				if refKey == "" {
					continue
				}
				refCol.AddID(refKey, wire.ReferenceLocator{
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
	if err = rows.Err(); err != nil {
		return TranslatePGError(err)
	}

	//fmt.Printf("PG LOAD %v\n", op.CollectionName)
	if env.InDevMode() {
		if op.CollectionName == "uesio/studio.workspace" {
			totalWorkspaceQueries.Add(1)
		}
		totalQueries.Add(1)
	}
	op.BatchNumber++

	err = datasource.HandleReferencesGroup(c, op.Collection, referencedGroupCollections, session)
	if err != nil {
		return err
	}

	err = datasource.HandleMultiCollectionReferences(c, referencedCollections, session)
	if err != nil {
		return err
	}

	return datasource.HandleReferences(c, referencedCollections, session, &datasource.ReferenceOptions{
		AllowMissingItems: true,
	})
}
