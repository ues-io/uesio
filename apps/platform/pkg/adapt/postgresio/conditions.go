package postgresio

import (
	"errors"
	"fmt"
	"reflect"
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
	isTextType := isTextAlike(fieldMetadata.Type)
	switch condition.Operator {
	case "IN", "NOT_IN":
		//IF we got values use normal flow
		if fieldMetadata.Type == "DATE" && condition.Values == nil {
			return processDateRangeCondition(condition, fieldName, builder)
		}
		if condition.Values != nil {
			if reflect.TypeOf(condition.Values).Kind() == reflect.Slice {
				var safeValues []string
				switch values := condition.Values.(type) {
				case []interface{}:
					if numValues := len(values); numValues > 0 {
						safeValues = make([]string, numValues)
						for i, val := range values {
							safeValues[i] = builder.addValue(val)
						}
					}
				case []string:
					if numValues := len(values); numValues > 0 {
						safeValues = make([]string, numValues)
						for i, val := range values {
							safeValues[i] = builder.addValue(val)
						}
					}
				default:
					fmt.Printf("Unsupported type for values array: %T\n", values)
				}
				if safeValues != nil {
					useOperator := "IN"
					if condition.Operator == "NOT_IN" {
						useOperator = "NOT IN"
					}
					if fieldMetadata.Type == "LIST" {
						prefix := ""
						useOperator = "@>"
						if condition.Operator == "NOT_IN" {
							prefix = "NOT"
						}
						for _, value := range safeValues {
							builder.addQueryPart(fmt.Sprintf("%s %s %s %s", prefix, fieldName, useOperator, value))
						}
					} else {
						builder.addQueryPart(fmt.Sprintf("%s %s (%s)", fieldName, useOperator, strings.Join(safeValues, ",")))
					}
				}
			} else {
				return errors.New(condition.Operator + " requires a values array to be provided")
			}
		} else {
			useOperator := "= ANY"
			if condition.Operator == "NOT_IN" {
				useOperator = "<> ANY"
			}
			builder.addQueryPart(fmt.Sprintf("%s %s (%s)", fieldName, useOperator, builder.addValue(condition.Value)))
		}

	case "HAS_ANY":
		if fieldMetadata.Type != "MULTISELECT" {
			return errors.New("Operator HAS_ANY only works with fieldType MULTI_SELECT")
		}
		builder.addQueryPart(fmt.Sprintf("%s ?| %s", fieldName, builder.addValue(condition.Values)))

	case "HAS_ALL":
		if fieldMetadata.Type != "MULTISELECT" {
			return errors.New("Operator HAS_ALL only works with fieldType MULTI_SELECT")
		}
		builder.addQueryPart(fmt.Sprintf("%s ?& %s", fieldName, builder.addValue(condition.Values)))

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
		if fieldMetadata.Type == "CHECKBOX" || fieldMetadata.Type == "TIMESTAMP" {
			builder.addQueryPart(fmt.Sprintf("%s IS NULL", fieldName))
		} else if isTextType {
			builder.addQueryPart(fmt.Sprintf("((%s IS NULL) OR (%s = 'null') OR (%s = ''))", fieldName, fieldName, fieldName))
		} else {
			builder.addQueryPart(fmt.Sprintf("((%s IS NULL) OR (%s = 'null'))", fieldName, fieldName))
		}
	case "IS_NOT_BLANK":
		if fieldMetadata.Type == "CHECKBOX" || fieldMetadata.Type == "TIMESTAMP" {
			builder.addQueryPart(fmt.Sprintf("%s IS NOT NULL", fieldName))
		} else if isTextType {
			builder.addQueryPart(fmt.Sprintf("((%s IS NOT NULL) AND (%s != 'null') AND (%s != ''))", fieldName, fieldName, fieldName))
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
			return fmt.Errorf("Operator CONTAINS is not supported for field type %s", fieldMetadata.Type)
		}
		builder.addQueryPart(fmt.Sprintf("%s ILIKE %s", fieldName, builder.addValue(fmt.Sprintf("%%%v%%", condition.Value))))

	case "STARTS_WITH":
		if !isTextType {
			return fmt.Errorf("Operator STARTS_WITH is not supported for field type %s", fieldMetadata.Type)
		}
		builder.addQueryPart(fmt.Sprintf("%s ILIKE %s", fieldName, builder.addValue(fmt.Sprintf("%v%%", condition.Value))))

	default:
		if fieldMetadata.Type == "MULTISELECT" {
			// Same as HAS_ANY
			builder.addQueryPart(fmt.Sprintf("%s ?| %s", fieldName, builder.addValue(condition.Values)))
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
	err = processConditionListForTenant(condition.SubConditions, subCollectionMetadata, metadata, subConditionsBuilder, subTableAlias, session)
	if err != nil {
		return err
	}

	subQueryBuilder := builder.getSubBuilder("")
	subQueryBuilder.addQueryPart(fmt.Sprintf("SELECT %s FROM data as \"%s\" WHERE %s", subFieldName, subTableAlias, subConditionsBuilder.String()))
	builder.addQueryPart(fmt.Sprintf("%s IN %s", fieldName, subQueryBuilder.String()))

	return nil
}

func processConditionListForTenant(conditions []adapt.LoadRequestCondition, collectionMetadata *adapt.CollectionMetadata, metadata *adapt.MetadataCache, builder *QueryBuilder, tableAlias string, session *sess.Session) error {
	tenantID := session.GetTenantIDForCollection(collectionMetadata.GetFullName())

	collectionName := collectionMetadata.GetFullName()

	//we don't filter by collection if we want recent metadata
	if collectionName != "uesio/studio.recentmetadata" {
		builder.addQueryPart(fmt.Sprintf("%s = %s", getAliasedName("collection", tableAlias), builder.addValue(collectionName)))
	}

	builder.addQueryPart(fmt.Sprintf("%s = %s", getAliasedName("tenant", tableAlias), builder.addValue(tenantID)))
	return processConditionList(conditions, collectionMetadata, metadata, builder, tableAlias, session)
}

func processConditionList(conditions []adapt.LoadRequestCondition, collectionMetadata *adapt.CollectionMetadata, metadata *adapt.MetadataCache, builder *QueryBuilder, tableAlias string, session *sess.Session) error {
	for _, condition := range conditions {

		if condition.Inactive {
			continue
		}

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
