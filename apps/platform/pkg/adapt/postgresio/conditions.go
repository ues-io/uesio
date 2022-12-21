package postgresio

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type QueryBuilder struct {
	Values      []interface{}
	Parts       []string
	Conjunction string
	Parent      *QueryBuilder
}

func NewQueryBuilder() *QueryBuilder {
	return &QueryBuilder{
		Values: []interface{}{},
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

func (qb *QueryBuilder) addValue(value interface{}) string {
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
	conjunctionWithSpace := fmt.Sprintf(" %s ", conjunction)
	if qb.Parent != nil {
		// Use parens if we are a sub builder
		return fmt.Sprintf("(%s)", strings.Join(qb.Parts, conjunctionWithSpace))
	}
	return strings.Join(qb.Parts, conjunctionWithSpace)
}

func processSearchCondition(condition adapt.LoadRequestCondition, collectionMetadata *adapt.CollectionMetadata, metadata *adapt.MetadataCache, builder *QueryBuilder, tableAlias string, session *sess.Session) error {

	nameFieldMetadata, err := collectionMetadata.GetNameField()
	if err != nil {
		return err
	}

	nameFieldDB := getFieldName(nameFieldMetadata, tableAlias)

	searchToken := condition.Value.(string)
	if searchToken == "" {
		return nil
	}
	searchFields := map[string]bool{
		nameFieldDB: true,
	}
	for _, field := range condition.SearchFields {
		fieldMetadata, err := collectionMetadata.GetField(field)
		if err != nil {
			return err
		}
		searchFields[getFieldName(fieldMetadata, tableAlias)] = true
	}
	// Split the search token on spaces to tokenize the search
	tokens := strings.Fields(searchToken)
	for _, token := range tokens {
		paramNumber := builder.addValue(fmt.Sprintf("%%%v%%", token))
		subbuilder := builder.getSubBuilder("OR")
		for field := range searchFields {
			fieldCast := "(" + field + ")::text"
			subbuilder.addQueryPart(fmt.Sprintf("%s ILIKE %s", fieldCast, paramNumber))
		}
		builder.addQueryPart(subbuilder.String())
	}
	return nil
}

func processValueCondition(condition adapt.LoadRequestCondition, collectionMetadata *adapt.CollectionMetadata, metadata *adapt.MetadataCache, builder *QueryBuilder, tableAlias string, session *sess.Session) error {
	fieldMetadata, err := collectionMetadata.GetField(condition.Field)
	if err != nil {
		return err
	}

	fieldName := getFieldName(fieldMetadata, tableAlias)
	switch condition.Operator {
	case "IN":
		if fieldMetadata.Type == "DATE" {
			return processDateRangeCondition(condition, fieldName, builder)
		}
		builder.addQueryPart(fmt.Sprintf("%s = ANY(%s)", fieldName, builder.addValue(condition.Value)))
	case "HAS_ANY":
		if fieldMetadata.Type != "MULTISELECT" {
			return errors.New("Operator HAS_ANY only works with fieldType MULTI_SELECT")
		}
		builder.addQueryPart(fmt.Sprintf("%s ?| %s", fieldName, builder.addValue(condition.Value)))

	case "HAS_ALL":
		if fieldMetadata.Type != "MULTISELECT" {
			return errors.New("Operator HAS_ALL only works with fieldType MULTI_SELECT")
		}
		builder.addQueryPart(fmt.Sprintf("%s ?& %s", fieldName, builder.addValue(condition.Value)))

	case "NOT_EQ":
		builder.addQueryPart(fmt.Sprintf("%s is distinct from %s", fieldName, builder.addValue(condition.Value)))

	case "GT":
		builder.addQueryPart(fmt.Sprintf("%s > %s", fieldName, builder.addValue(condition.Value)))

	case "LT":
		builder.addQueryPart(fmt.Sprintf("%s < %s", fieldName, builder.addValue(condition.Value)))

	case "GTE":
		builder.addQueryPart(fmt.Sprintf("%s >= %s", fieldName, builder.addValue(condition.Value)))

	case "LTE":
		builder.addQueryPart(fmt.Sprintf("%s <= %s", fieldName, builder.addValue(condition.Value)))

	case "IS_BLANK":
		builder.addQueryPart(fmt.Sprintf("%s IS NULL", fieldName))

	case "IS_NOT_BLANK":
		builder.addQueryPart(fmt.Sprintf("%s IS NOT NULL", fieldName))

	default:
		if fieldMetadata.Type == "MULTISELECT" {
			// Same as HAS_ANY
			builder.addQueryPart(fmt.Sprintf("%s ?| %s", fieldName, builder.addValue(condition.Value)))
		}
		builder.addQueryPart(fmt.Sprintf("%s = %s", fieldName, builder.addValue(condition.Value)))
	}
	return nil
}

func processGroupCondition(condition adapt.LoadRequestCondition, collectionMetadata *adapt.CollectionMetadata, metadata *adapt.MetadataCache, builder *QueryBuilder, tableAlias string, session *sess.Session) error {
	subbuilder := builder.getSubBuilder(condition.Conjunction)
	err := processConditionList(condition.SubConditions, collectionMetadata, metadata, subbuilder, tableAlias, session)
	if err != nil {
		return err
	}
	builder.addQueryPart(subbuilder.String())
	return nil
}

func processSubQueryCondition(condition adapt.LoadRequestCondition, collectionMetadata *adapt.CollectionMetadata, metadata *adapt.MetadataCache, builder *QueryBuilder, tableAlias string, session *sess.Session) error {

	fieldMetadata, err := collectionMetadata.GetField(condition.Field)
	if err != nil {
		return err
	}

	subTableAlias := "subquery"

	fieldName := getFieldName(fieldMetadata, tableAlias)

	subFieldMetadata, err := collectionMetadata.GetField(condition.SubField)
	if err != nil {
		return err
	}

	subFieldName := getFieldName(subFieldMetadata, subTableAlias)

	subCollectionMetadata, err := metadata.GetCollection(condition.SubCollection)
	if err != nil {
		return err
	}

	subConditionsBuilder := builder.getSubBuilder("")
	err = processConditionList(condition.SubConditions, subCollectionMetadata, metadata, subConditionsBuilder, subTableAlias, session)
	if err != nil {
		return err
	}

	subQueryBuilder := builder.getSubBuilder("")
	subQueryBuilder.addQueryPart(fmt.Sprintf("SELECT %s FROM data as \"%s\" WHERE %s", subFieldName, subTableAlias, subConditionsBuilder.String()))
	builder.addQueryPart(fmt.Sprintf("%s IN %s", fieldName, subQueryBuilder.String()))

	return nil
}

func processConditionList(conditions []adapt.LoadRequestCondition, collectionMetadata *adapt.CollectionMetadata, metadata *adapt.MetadataCache, builder *QueryBuilder, tableAlias string, session *sess.Session) error {
	tenantID := session.GetTenantIDForCollection(collectionMetadata.GetFullName())

	collectionName := collectionMetadata.GetFullName()

	// Shortcut optimization for id field and unique key
	if len(conditions) == 1 {
		canOptimizeOperator := conditions[0].Operator == "IN" || conditions[0].Operator == "EQ" || conditions[0].Operator == ""
		if canOptimizeOperator && conditions[0].Field == adapt.ID_FIELD {
			return conditionOptimization(conditions[0], collectionName, tenantID, builder, "id", tableAlias)
		}
		if canOptimizeOperator && conditions[0].Field == adapt.UNIQUE_KEY_FIELD {
			return conditionOptimization(conditions[0], collectionName, tenantID, builder, "uniquekey", tableAlias)
		}
	}

	builder.addQueryPart(fmt.Sprintf("%s = %s", getAliasedName("collection", tableAlias), builder.addValue(collectionName)))
	builder.addQueryPart(fmt.Sprintf("%s = %s", getAliasedName("tenant", tableAlias), builder.addValue(tenantID)))
	for _, condition := range conditions {
		err := processCondition(condition, collectionMetadata, metadata, builder, tableAlias, session)
		if err != nil {
			return err
		}
	}
	return nil
}

func processCondition(condition adapt.LoadRequestCondition, collectionMetadata *adapt.CollectionMetadata, metadata *adapt.MetadataCache, builder *QueryBuilder, tableAlias string, session *sess.Session) error {

	if condition.Type == "SEARCH" {
		return processSearchCondition(condition, collectionMetadata, metadata, builder, tableAlias, session)
	}

	if condition.Type == "GROUP" {
		return processGroupCondition(condition, collectionMetadata, metadata, builder, tableAlias, session)
	}

	if condition.Type == "SUBQUERY" {
		return processSubQueryCondition(condition, collectionMetadata, metadata, builder, tableAlias, session)
	}

	return processValueCondition(condition, collectionMetadata, metadata, builder, tableAlias, session)
}

func conditionOptimization(condition adapt.LoadRequestCondition, collectionName, tenantID string, builder *QueryBuilder, fieldName, tableAlias string) error {

	collectionField := getAliasedName("collection", tableAlias)
	tenantField := getAliasedName("tenant", tableAlias)
	builder.addQueryPart(fmt.Sprintf("%s = %s", collectionField, builder.addValue(collectionName)))
	builder.addQueryPart(fmt.Sprintf("%s = %s", tenantField, builder.addValue(tenantID)))

	optimizeField := getAliasedName(fieldName, tableAlias)
	if condition.Operator != "IN" {
		builder.addQueryPart(fmt.Sprintf("%s = %s", optimizeField, builder.addValue(condition.Value)))
		return nil
	}

	// This allows the values to be either a string or a slice of strings
	values, err := adapt.GetStringSlice(condition.Value)
	if err != nil {
		return err
	}

	if len(values) == 1 {
		builder.addQueryPart(fmt.Sprintf("%s = %s", optimizeField, builder.addValue(values[0])))
		return nil
	}

	appendedValues := make([]string, len(values))
	for i, v := range values {
		appendedValues[i] = v
	}
	builder.addQueryPart(fmt.Sprintf("%s = ANY(%s)", optimizeField, builder.addValue(appendedValues)))
	return nil
}
