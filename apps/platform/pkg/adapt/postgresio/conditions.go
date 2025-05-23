package postgresio

import (
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type QueryBuilder struct {
	Values      []any
	Parts       []string
	Conjunction string
	Parent      *QueryBuilder
}

var operatorMap = map[string]string{
	"GT":  ">",
	"GTE": ">=",
	"LT":  "<",
	"LTE": "<=",
}

func NewQueryBuilder() *QueryBuilder {
	return &QueryBuilder{
		Values: []any{},
		Parts:  []string{},
	}
}

func (qb *QueryBuilder) getSubBuilder(conjunction string) *QueryBuilder {
	return &QueryBuilder{
		Parts:       []string{},
		Conjunction: conjunction,
		Parent:      qb,
	}
}

func (qb *QueryBuilder) getBase() *QueryBuilder {
	if qb.Parent == nil {
		return qb
	}
	return qb.Parent.getBase()
}

func (qb *QueryBuilder) addValue(value any) string {
	base := qb.getBase()
	base.Values = append(base.Values, value)
	return "$" + strconv.Itoa(len(base.Values))
}

func (qb *QueryBuilder) addQueryPart(part string) {
	qb.Parts = append(qb.Parts, part)
}

func (qb *QueryBuilder) String() string {
	conjunction := qb.Conjunction
	if conjunction == "" {
		conjunction = "AND"
	}
	conjunctionWithSpace := fmt.Sprintf(" %s\n", conjunction)
	if qb.Parent != nil {
		// Use parens if we are a sub builder
		return fmt.Sprintf("(%s)", strings.Join(qb.Parts, conjunctionWithSpace))
	}
	return strings.Join(qb.Parts, conjunctionWithSpace)
}

func isTextAlike(fieldType string) bool {
	if fieldType == "TEXT" || fieldType == "AUTONUMBER" || fieldType == "EMAIL" || fieldType == "LONGTEXT" || fieldType == "SELECT" || fieldType == "DATE" {
		return true
	}
	return false
}

func processSearchCondition(condition wire.LoadRequestCondition, collectionMetadata *wire.CollectionMetadata, builder *QueryBuilder, tableAlias string) error {

	nameFieldMetadata, err := collectionMetadata.GetNameField()
	if err != nil {
		return err
	}

	nameFieldDB := getFieldName(nameFieldMetadata, tableAlias)

	searchToken := condition.Value.(string)
	if searchToken == "" {
		return nil
	}
	searchFieldsArray := []string{
		nameFieldDB,
	}
	uniqueSearchFields := map[string]bool{
		nameFieldDB: true,
	}
	for _, field := range condition.SearchFields {
		fieldMetadata, err := collectionMetadata.GetField(field)
		if err != nil {
			return err
		}
		dbFieldName := getFieldName(fieldMetadata, tableAlias)
		if _, exists := uniqueSearchFields[dbFieldName]; !exists {
			uniqueSearchFields[dbFieldName] = true
			searchFieldsArray = append(searchFieldsArray, dbFieldName)
		}
	}
	// Split the search token on spaces to tokenize the search
	tokens := strings.Fields(searchToken)
	// Order the search fields to ensure consistent iteration order
	sort.Strings(searchFieldsArray)

	for _, token := range tokens {
		paramNumber := builder.addValue(fmt.Sprintf("%%%v%%", token))
		subBuilder := builder.getSubBuilder("OR")
		for _, field := range searchFieldsArray {
			fieldCast := "(" + field + ")::text"
			subBuilder.addQueryPart(fmt.Sprintf("%s ILIKE %s", fieldCast, paramNumber))
		}
		builder.addQueryPart(subBuilder.String())
	}
	return nil
}

func isCoreUUIDField(fieldName string) bool {
	switch fieldName {
	case commonfields.Id, commonfields.UpdatedBy, commonfields.CreatedBy, commonfields.Owner:
		return true
	}
	return false
}

func processValueCondition(condition wire.LoadRequestCondition, collectionMetadata *wire.CollectionMetadata, builder *QueryBuilder, tableAlias string) error {
	fieldMetadata, err := collectionMetadata.GetField(condition.Field)
	if err != nil {
		return err
	}
	fieldHasPath := strings.Contains(condition.Field, constant.RefSep)
	fieldName := getFieldName(fieldMetadata, tableAlias)
	fieldType := fieldMetadata.Type
	isTextType := isTextAlike(fieldType)

	// If the original condition field contains a path operator, we need to send that original field name
	// into the actual query
	if fieldHasPath {
		mainFieldMetadata, err := collectionMetadata.GetField(strings.Split(condition.Field, constant.RefSep)[0])
		if err != nil {
			return err
		} else if mainFieldMetadata.Type == "STRUCT" {
			fieldName = getFieldNameString(fieldMetadata.Type, getAliasedName("fields", tableAlias), condition.Field)
		} else {
			return fmt.Errorf("field %s (type %s) does not support use of the path operator %s", condition.Field, mainFieldMetadata.Type, constant.RefSep)
		}
	}

	useValue := condition.Value
	useValues := condition.Values

	isCoreUUIDField := isCoreUUIDField(fieldName)

	// Special handling for our uuid fields (we have to cast them to uuid)
	if useValue != nil && isCoreUUIDField {
		useValueString, ok := useValue.(string)
		if !ok {
			return fmt.Errorf("value must be string for field: %s : %s", fieldName, useValue)
		}
		useValue = useValueString
	}

	if useValues != nil && isCoreUUIDField {
		// Cast the value to a slice of strings
		uuidStrings := []string{}
		useValueSlice, ok := useValue.([]any)
		if !ok {
			return fmt.Errorf("value must be slice of strings for field: %s : %s", fieldMetadata.GetFullName(), useValue)
		}
		for _, val := range useValueSlice {
			useValueString, ok := val.(string)
			if !ok {
				return fmt.Errorf("value must be string for field: %s : %s", fieldName, val)
			}
			uuidStrings = append(uuidStrings, useValueString)
		}
		useValues = uuidStrings
	}

	switch condition.Operator {
	case "IN", "NOT_IN":
		//IF we got values use normal flow
		if (fieldType == "DATE" || fieldType == "TIMESTAMP") && condition.Values == nil {
			return processDateRangeCondition(condition, fieldName, fieldType, builder)
		}

		useOperator := "IS NOT NULL"
		if condition.Operator == "NOT_IN" {
			useOperator = "IS NULL"
		}
		if useValues != nil {
			useValue = useValues
		}
		builder.addQueryPart(fmt.Sprintf("array_position(%s,%s) %s", builder.addValue(useValue), fieldName, useOperator))

	case "HAS_ANY":
		if fieldType != "MULTISELECT" {
			return errors.New("operator HAS_ANY only works with fieldType MULTI_SELECT")
		}
		builder.addQueryPart(fmt.Sprintf("%s ?| %s", fieldName, builder.addValue(useValues)))

	case "HAS_ALL":
		if fieldType != "MULTISELECT" {
			return errors.New("operator HAS_ALL only works with fieldType MULTI_SELECT")
		}
		builder.addQueryPart(fmt.Sprintf("%s ?& %s", fieldName, builder.addValue(useValues)))

	case "NOT_EQ":
		builder.addQueryPart(fmt.Sprintf("%s is distinct from %s", fieldName, builder.addValue(useValue)))

	case "GT", "LT", "GTE", "LTE":
		opString := operatorMap[condition.Operator]
		if fieldType == "TIMESTAMP" {
			useValue = getTimestampValue(condition)
		}
		builder.addQueryPart(fmt.Sprintf("%s %s %s", fieldName, opString, builder.addValue(useValue)))

	case "IS_BLANK":
		if fieldType == "CHECKBOX" || fieldType == "TIMESTAMP" {
			builder.addQueryPart(fieldName + " IS NULL")
		} else if isTextType {
			builder.addQueryPart(fmt.Sprintf("((%s IS NULL) OR (%s = 'null') OR (%s = ''))", fieldName, fieldName, fieldName))
		} else if fieldType == "STRUCT" {
			builder.addQueryPart(fmt.Sprintf("((%s IS NULL) OR (%s = '{}'))", fieldName, fieldName))
		} else {
			builder.addQueryPart(fmt.Sprintf("((%s IS NULL) OR (%s = 'null'))", fieldName, fieldName))
		}
	case "IS_NOT_BLANK":
		if fieldType == "CHECKBOX" || fieldType == "TIMESTAMP" {
			builder.addQueryPart(fieldName + " IS NOT NULL")
		} else if isTextType {
			builder.addQueryPart(fmt.Sprintf("((%s IS NOT NULL) AND (%s != 'null') AND (%s != ''))", fieldName, fieldName, fieldName))
		} else if fieldType == "STRUCT" {
			builder.addQueryPart(fmt.Sprintf("((%s IS NOT NULL) AND (%s != '{}'))", fieldName, fieldName))
		} else {
			builder.addQueryPart(fmt.Sprintf("((%s IS NOT NULL) AND (%s != 'null'))", fieldName, fieldName))
		}
	case "BETWEEN":
		startOperator := ">"
		endOperator := "<"

		if condition.InclusiveStart {
			startOperator = ">="
		}

		if condition.InclusiveEnd {
			endOperator = "<="
		}

		builder.addQueryPart(fmt.Sprintf("%s %s %s", fieldName, startOperator, builder.addValue(condition.Start)))
		builder.addQueryPart(fmt.Sprintf("%s %s %s", fieldName, endOperator, builder.addValue(condition.End)))

	case "CONTAINS":
		if !isTextType {
			return fmt.Errorf("operator CONTAINS is not supported for field type %s", fieldType)
		}
		builder.addQueryPart(fmt.Sprintf("%s ILIKE %s", fieldName, builder.addValue(fmt.Sprintf("%%%v%%", useValue))))

	case "STARTS_WITH":
		if !isTextType {
			return fmt.Errorf("operator STARTS_WITH is not supported for field type %s", fieldType)
		}
		builder.addQueryPart(fmt.Sprintf("%s ILIKE %s", fieldName, builder.addValue(fmt.Sprintf("%v%%", useValue))))

	default:
		if fieldType == "MULTISELECT" {
			// Same as HAS_ANY
			builder.addQueryPart(fmt.Sprintf("%s ?| %s", fieldName, builder.addValue(useValues)))
		}
		builder.addQueryPart(fmt.Sprintf("%s = %s", fieldName, builder.addValue(useValue)))
	}
	return nil
}

func processGroupCondition(condition wire.LoadRequestCondition, collectionMetadata *wire.CollectionMetadata, metadata *wire.MetadataCache, builder *QueryBuilder, tableAlias string, session *sess.Session) error {
	subbuilder := builder.getSubBuilder(condition.Conjunction)
	err := processConditionList(condition.SubConditions, collectionMetadata, metadata, subbuilder, tableAlias, session)
	if err != nil {
		return err
	}
	builder.addQueryPart(subbuilder.String())
	return nil
}

func processSubQueryCondition(condition wire.LoadRequestCondition, collectionMetadata *wire.CollectionMetadata, metadata *wire.MetadataCache, builder *QueryBuilder, tableAlias string, session *sess.Session) error {

	fieldMetadata, err := collectionMetadata.GetField(condition.Field)
	if err != nil {
		return err
	}

	subTableAlias := "subquery"

	fieldName := getFieldName(fieldMetadata, tableAlias)

	subCollectionMetadata, err := metadata.GetCollection(condition.SubCollection)
	if err != nil {
		return err
	}

	subFieldMetadata, err := subCollectionMetadata.GetField(condition.SubField)
	if err != nil {
		return err
	}

	subFieldName := getFieldName(subFieldMetadata, subTableAlias)

	fieldIsCoreUUID := isCoreUUIDField(fieldMetadata.GetFullName())
	subFieldIsCoreUUID := isCoreUUIDField(subFieldMetadata.GetFullName())

	if fieldIsCoreUUID && !subFieldIsCoreUUID {
		subFieldName = "(" + subFieldName + ")::uuid"
	}
	if subFieldIsCoreUUID && !fieldIsCoreUUID {
		fieldName = "(" + fieldName + ")::uuid"
	}

	subConditionsBuilder := builder.getSubBuilder("")
	if err = processConditionListForTenant(condition.SubConditions, subCollectionMetadata, metadata, subConditionsBuilder, subTableAlias, session); err != nil {
		return err
	}

	subQueryBuilder := builder.getSubBuilder("")
	subQueryBuilder.addQueryPart(fmt.Sprintf("SELECT %s FROM data as \"%s\" WHERE %s", subFieldName, subTableAlias, subConditionsBuilder.String()))
	builder.addQueryPart(fmt.Sprintf("%s IN %s", fieldName, subQueryBuilder.String()))

	return nil
}

func addTenantConditions(collectionMetadata *wire.CollectionMetadata, builder *QueryBuilder, tableAlias string, session *sess.Session) {
	tenantID := session.GetTenantIDForCollection(collectionMetadata.GetFullName())

	collectionName := collectionMetadata.GetFullName()

	//we don't filter by collection if we want recent metadata or if we are querying the common collection
	if collectionName != "uesio/studio.recentmetadata" && collectionName != constant.CommonCollection {
		builder.addQueryPart(fmt.Sprintf("%s = %s", getAliasedName("collection", tableAlias), builder.addValue(collectionName)))
	}

	builder.addQueryPart(fmt.Sprintf("%s = %s", getAliasedName("tenant", tableAlias), builder.addValue(tenantID)))
}

func processConditionListForTenant(conditions []wire.LoadRequestCondition, collectionMetadata *wire.CollectionMetadata, metadata *wire.MetadataCache, builder *QueryBuilder, tableAlias string, session *sess.Session) error {
	addTenantConditions(collectionMetadata, builder, tableAlias, session)
	return processConditionList(conditions, collectionMetadata, metadata, builder, tableAlias, session)
}

func processConditionList(conditions []wire.LoadRequestCondition, collectionMetadata *wire.CollectionMetadata, metadata *wire.MetadataCache, builder *QueryBuilder, tableAlias string, session *sess.Session) error {
	for _, condition := range conditions {
		if err := processCondition(condition, collectionMetadata, metadata, builder, tableAlias, session); err != nil {
			return err
		}
	}
	return nil
}

func processCondition(condition wire.LoadRequestCondition, collectionMetadata *wire.CollectionMetadata, metadata *wire.MetadataCache, builder *QueryBuilder, tableAlias string, session *sess.Session) error {

	if condition.Type == "SEARCH" {
		return processSearchCondition(condition, collectionMetadata, builder, tableAlias)
	}

	if condition.Type == "GROUP" {
		return processGroupCondition(condition, collectionMetadata, metadata, builder, tableAlias, session)
	}

	if condition.Type == "SUBQUERY" {
		return processSubQueryCondition(condition, collectionMetadata, metadata, builder, tableAlias, session)
	}

	return processValueCondition(condition, collectionMetadata, builder, tableAlias)
}
