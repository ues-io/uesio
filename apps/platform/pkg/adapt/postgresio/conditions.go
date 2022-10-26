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

func processSearchCondition(condition adapt.LoadRequestCondition, collectionMetadata *adapt.CollectionMetadata, builder *QueryBuilder) error {

	nameFieldMetadata, err := collectionMetadata.GetNameField()
	if err != nil {
		return err
	}

	nameFieldDB := getFieldName(nameFieldMetadata)

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
		searchFields[getFieldName(fieldMetadata)] = true
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

func processValueCondition(condition adapt.LoadRequestCondition, collectionMetadata *adapt.CollectionMetadata, builder *QueryBuilder) error {
	fieldMetadata, err := collectionMetadata.GetField(condition.Field)
	if err != nil {
		return err
	}

	fieldName := getFieldName(fieldMetadata)
	switch condition.Operator {
	case "IN":
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
		builder.addQueryPart(fmt.Sprintf("%s ?| %s", fieldName, builder.addValue(condition.Value)))

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

func processGroupCondition(condition adapt.LoadRequestCondition, collectionMetadata *adapt.CollectionMetadata, builder *QueryBuilder) error {
	subbuilder := builder.getSubBuilder(condition.Conjunction)
	for _, subcondition := range condition.SubConditions {
		err := processCondition(subcondition, collectionMetadata, subbuilder)
		if err != nil {
			return err
		}
	}
	builder.addQueryPart(subbuilder.String())
	return nil
}

func processCondition(condition adapt.LoadRequestCondition, collectionMetadata *adapt.CollectionMetadata, builder *QueryBuilder) error {

	if condition.Type == "SEARCH" {
		return processSearchCondition(condition, collectionMetadata, builder)
	}

	if condition.Type == "GROUP" {
		return processGroupCondition(condition, collectionMetadata, builder)
	}

	return processValueCondition(condition, collectionMetadata, builder)
}

func idConditionOptimization(condition *adapt.LoadRequestCondition, collectionName string, builder *QueryBuilder) {
	if condition.Operator != "IN" {
		builder.addQueryPart(fmt.Sprintf("main.id = %s", builder.addValue(makeDBId(collectionName, condition.Value))))
		return
	}

	values := condition.Value.([]string)
	if len(values) == 1 {
		builder.addQueryPart(fmt.Sprintf("main.id = %s", builder.addValue(makeDBId(collectionName, values[0]))))
		return
	}

	appendedValues := make([]string, len(values))
	for i, v := range values {
		appendedValues[i] = makeDBId(collectionName, v)
	}
	builder.addQueryPart(fmt.Sprintf("main.id = ANY(%s)", builder.addValue(appendedValues)))
	return
}

func getConditions(
	op *adapt.LoadOp,
	metadata *adapt.MetadataCache,
	collectionMetadata *adapt.CollectionMetadata,
	session *sess.Session,
	builder *QueryBuilder,
) error {

	tenantID := session.GetTenantIDForCollection(collectionMetadata.GetFullName())

	collectionName, err := getDBCollectionName(collectionMetadata, tenantID)
	if err != nil {
		return err
	}

	// Shortcut optimization
	if len(op.Conditions) == 1 && op.Conditions[0].Field == adapt.ID_FIELD && (op.Conditions[0].Operator == "IN" || op.Conditions[0].Operator == "EQ") {
		idConditionOptimization(&op.Conditions[0], collectionName, builder)
		return nil
	}

	builder.addQueryPart(fmt.Sprintf("main.collection = %s", builder.addValue(collectionName)))

	for _, condition := range op.Conditions {
		err := processCondition(condition, collectionMetadata, builder)
		if err != nil {
			return err
		}
	}

	return nil
}
