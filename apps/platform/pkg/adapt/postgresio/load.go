package postgresio

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"

	"github.com/teris-io/shortid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/formula"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

var queryCounts sync.Map

var debugSQL = os.Getenv("UESIO_DEBUG_SQL") == "true"

func init() {
	if env.InDevMode() {
		ResetQueryStatistics()
	}
}

type QueryStatistics struct {
	QueriesByCollection map[string]int64 `json:"queriesByCollection"`
	TotalQueries        int64            `json:"totalQueries"`
}

func GetQueryStatistics() QueryStatistics {
	queryCountsResult := make(map[string]int64)
	var totalQueries int64
	queryCounts.Range(func(k any, v any) bool {
		intValue := v.(*int64)
		totalQueries = totalQueries + *intValue
		queryCountsResult[k.(string)] = *intValue
		return true
	})

	return QueryStatistics{
		QueriesByCollection: queryCountsResult,
		TotalQueries:        totalQueries,
	}
}

func ResetQueryStatistics() {
	queryCounts = sync.Map{}
}

const (
	stabby     = "->"
	waffleCone = "#>"
)

func getFieldNameWithAlias(fieldMetadata *wire.FieldMetadata) string {
	fieldName := getJSONBFieldName(fieldMetadata, "main")
	return fmt.Sprintf("'%s',%s", fieldMetadata.GetFullName(), fieldName)
}

func getFunctionText(aggregation *wire.AggregationField) string {
	fieldName := getFieldName(aggregation.Metadata, "main")
	switch aggregation.Function {
	case "DATE_TRUNC_DAY":
		if aggregation.Metadata.Type == "DATE" {
			return fmt.Sprintf("DATE_TRUNC('day',to_timestamp(%s,'YYYY-MM-DD'))::date", fieldName)
		}
		return fmt.Sprintf("DATE_TRUNC('day',to_timestamp(%s))::date", fieldName)
	case "DATE_TRUNC_MONTH":
		if aggregation.Metadata.Type == "DATE" {
			return fmt.Sprintf("DATE_TRUNC('month',to_timestamp(%s,'YYYY-MM-DD'))::date", fieldName)
		}
		return fmt.Sprintf("DATE_TRUNC('month',to_timestamp(%s))::date", fieldName)
	case "SUM":
		return fmt.Sprintf("SUM((%s)::numeric)", fieldName)
	}
	return fmt.Sprintf("%s(%s)", aggregation.Function, fieldName)
}

func getAggregationFieldNameWithAlias(aggregation *wire.AggregationField) string {
	fieldName := getFieldName(aggregation.Metadata, "main")
	if aggregation.Function == "" {
		return fmt.Sprintf("'%s',%s", aggregation.Metadata.GetFullName(), fieldName)
	}

	functionText := getFunctionText(aggregation)
	lowercaseFunction := strings.ToLower(aggregation.Function)
	return fmt.Sprintf("'%s_%s',%s", aggregation.Metadata.GetFullName(), lowercaseFunction, functionText)
}

func getGroupByFieldNameWithAlias(aggregation *wire.AggregationField) string {
	if aggregation.Function == "" {
		return getFieldName(aggregation.Metadata, "main")
	}
	return getFunctionText(aggregation)
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

	fieldsField := getAliasedName("fields", tableAlias)
	return getFieldNameString(fieldMetadata.Type, fieldsField, fieldName)
}

func getAliasedName(name, alias string) string {
	if alias == "" {
		return name
	}
	return fmt.Sprintf("%s.%s", alias, name)
}

func (c *Connection) Load(ctx context.Context, op *wire.LoadOp, session *sess.Session) error {

	// If we're loading uesio/core.user from a workspace, always use the site
	// tenant id, not the workspace tenant id. Since workspaces don't have users.
	if op.CollectionName == "uesio/core.user" && session.GetWorkspaceSession() != nil {
		session = session.RemoveWorkspaceContext()
	}

	metadata, err := op.GetMetadata()
	if err != nil {
		return err
	}

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	fieldsResponse, err := wire.GetFieldsResponse(op, collectionMetadata, metadata)
	if err != nil {
		return err
	}

	var fieldIDs []string
	groupByClause := ""
	groupBySelects := ""

	if !op.Aggregate {
		fieldIDs, err = wire.GetUniqueDBFieldNames(fieldsResponse.LoadFields, getFieldNameWithAlias)
		if err != nil {
			return err
		}
	} else {
		fieldIDs, err = wire.GetAggregationFieldNames(fieldsResponse.AggregationFields, fieldsResponse.GroupByFields, getAggregationFieldNameWithAlias)
		if err != nil {
			return err
		}
		groupBySelects, err = wire.GetGroupBySelects(fieldsResponse.GroupByFields, getGroupByFieldNameWithAlias)
		if err != nil {
			return err
		}
		groupByClause, err = wire.GetGroupByClause(fieldsResponse.GroupByFields, "", getGroupByFieldNameWithAlias)
		if err != nil {
			return err
		}
	}

	joins := []string{}

	builder := NewQueryBuilder()

	err = processConditionListForTenant(op.Conditions, collectionMetadata, metadata, builder, "main", session)
	if err != nil {
		return err
	}
	flatTokens := session.GetFlatTokens()
	targetTableName := collectionMetadata.GetTableName()
	mainTableAlias := "main"

	if op.NeedsRecordLevelAccessCheck() && flatTokens != nil {

		challengeMetadata := collectionMetadata
		currentTable := mainTableAlias
		currentTableIdFieldName := "id"
		accessFieldID := fmt.Sprintf("%s.%s", mainTableAlias, currentTableIdFieldName)

		for challengeMetadata.AccessField != "" {

			accessField := challengeMetadata.AccessField

			fieldMetadata, err := challengeMetadata.GetField(accessField)
			if err != nil {
				return err
			}
			challengeMetadata, err = metadata.GetCollection(fieldMetadata.ReferenceMetadata.GetCollection())
			targetTableName := challengeMetadata.GetTableName()
			if err != nil {
				return err
			}

			newTable := currentTable + "sub"

			accessFieldString := getFieldName(fieldMetadata, currentTable)
			idFieldString := getAliasedName("id", newTable)

			subBuilder := builder.getSubBuilder("")
			addTenantConditions(challengeMetadata, subBuilder, newTable, session)

			joins = append(joins, fmt.Sprintf("LEFT OUTER JOIN %s as \"%s\" ON (%s)::uuid = %s AND %s\n", targetTableName, newTable, accessFieldString, idFieldString, subBuilder.String()))

			accessFieldID = getAliasedName("id", newTable)

			currentTable = newTable

		}

		if op.RequireWriteAccess {
			builder.addQueryPart(fmt.Sprintf("%s IN (SELECT recordid FROM tokens WHERE token = ANY(%s) AND readonly != true)", accessFieldID, builder.addValue(flatTokens)))
		} else if collectionMetadata.IsReadProtected() {
			builder.addQueryPart(fmt.Sprintf("%s IN (SELECT recordid FROM tokens WHERE token = ANY(%s))", accessFieldID, builder.addValue(flatTokens)))
		}
	}

	loadQuery := "SELECT\n" +
		"jsonb_build_object(\n" +
		strings.Join(fieldIDs, ",\n") +
		"\n)" + groupBySelects +
		"\nFROM " + targetTableName + " as \"" + mainTableAlias + "\"\n" +
		strings.Join(joins, "") +
		"WHERE\n" +
		builder.String() +
		groupByClause

	var orders []string
	for i := range op.Order {
		order := op.Order[i]
		fieldMetadata, err := collectionMetadata.GetField(order.Field)
		if err != nil {
			return err
		}
		fieldName := getFieldName(fieldMetadata, mainTableAlias)
		dir := "asc"
		if order.Desc {
			dir = "desc"
		}
		orders = append(orders, fieldName+" "+dir)
	}

	if len(orders) > 0 {
		loadQuery = loadQuery + "\nORDER BY " + strings.Join(orders, ",")
	}

	// Special handling for empty order by on aggregate queries
	if op.Aggregate && len(orders) == 0 {
		orderByClause, err := wire.GetGroupByClause(fieldsResponse.GroupByFields, "ORDER BY", getGroupByFieldNameWithAlias)
		if err != nil {
			return err
		}
		loadQuery = loadQuery + orderByClause
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

	op.HasMoreBatches = false
	formulaPopulations := formula.GetFormulaFunction(ctx, fieldsResponse.FormulaFields, collectionMetadata)

	err = c.Query(ctx, func(scan func(dest ...any) error, index int) (bool, error) {

		if op.BatchSize == index {
			op.HasMoreBatches = true
			return true, nil
		}

		item := op.Collection.NewItem()

		if op.Aggregate {
			// For aggregate operations, we need to create extra columns to
			// aggregate on. However, since we're having postgres already build
			// our json response in the first column returned, we can just throw
			// away the rest of our columns. We can do this by scanning into "nil".
			scanItems := []any{item}
			for range op.GroupBy {
				scanItems = append(scanItems, nil)
			}
			err := scan(scanItems...)
			if err != nil {
				return false, err
			}
			fakeID, _ := shortid.Generate()
			item.SetField(commonfields.Id, fakeID)
		} else {
			err := scan(item)
			if err != nil {
				return false, err
			}
		}

		for _, refCol := range fieldsResponse.ReferencedColletions {
			for _, fieldMetadata := range refCol.RefFields {
				refObj, err := item.GetField(fieldMetadata.GetFullName())
				if err != nil {
					return false, err
				}
				if refObj == nil {
					continue
				}
				refKey, err := wire.GetReferenceKey(refObj)
				if err != nil {
					return false, err
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
			return false, err
		}

		err = op.Collection.AddItem(item)
		if err != nil {
			return false, err
		}

		return false, nil

	}, loadQuery, builder.Values...)
	if err != nil {
		return TranslatePGError(err)
	}

	//fmt.Printf("PG LOAD %v -> %s %s\n", op.CollectionName, op.WireName, time.Since(start))
	if env.InDevMode() {
		val, _ := queryCounts.LoadOrStore(op.CollectionName, new(int64))
		ptr := val.(*int64)
		atomic.AddInt64(ptr, 1)
	}
	op.BatchNumber++

	err = datasource.HandleReferencesGroup(c, op.Collection, fieldsResponse.ReferencedGroupCollections, metadata, session)
	if err != nil {
		return err
	}

	err = datasource.HandleMultiCollectionReferences(c, fieldsResponse.ReferencedColletions, metadata, session)
	if err != nil {
		return err
	}

	return datasource.HandleReferences(c, fieldsResponse.ReferencedColletions, metadata, session, &datasource.ReferenceOptions{
		AllowMissingItems: true,
	})
}
