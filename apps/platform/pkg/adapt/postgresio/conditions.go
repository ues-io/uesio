package postgresio

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

type QueryBuilder struct {
	Values []interface{}
	Parts  []string
}

func NewQueryBuilder() *QueryBuilder {
	return &QueryBuilder{
		Values: []interface{}{},
		Parts:  []string{},
	}
}

func (qb *QueryBuilder) addValue(value interface{}) string {
	qb.Values = append(qb.Values, value)
	return "$" + strconv.Itoa(len(qb.Values))
}

func (qb *QueryBuilder) addQueryPart(part string) {
	qb.Parts = append(qb.Parts, part)
}

func processCondition(condition adapt.LoadRequestCondition, collectionMetadata *adapt.CollectionMetadata, builder *QueryBuilder) error {

	fieldMetadata, err := collectionMetadata.GetField(condition.Field)
	if err != nil {
		return err
	}

	fieldName := getFieldName(fieldMetadata)

	switch condition.Operator {
	case "IN":
		_, ok := condition.Value.([]string)
		if !ok {
			return errors.New("Invalid IN condition value")
		}
		builder.addQueryPart(fmt.Sprintf("%s = ANY(%s)", fieldName, builder.addValue(condition.Value)))

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
		builder.addQueryPart(fmt.Sprintf("%s = %s", fieldName, builder.addValue(condition.Value)))
	}
	return nil
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
	credentials *adapt.Credentials,
	builder *QueryBuilder,
) error {

	tenantID := credentials.GetTenantIDForCollection(collectionMetadata.GetFullName())

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

		if condition.Type == "SEARCH" {
			nameFieldMetadata, err := collectionMetadata.GetNameField()
			if err != nil {
				return err
			}

			nameFieldDB := getFieldName(nameFieldMetadata)

			searchToken := condition.Value.(string)
			if searchToken == "" {
				continue
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
				searchConditions := []string{}
				paramNumber := builder.addValue(fmt.Sprintf("%%%v%%", token))
				for field := range searchFields {
					searchConditions = append(searchConditions, field+" ILIKE "+paramNumber)
				}
				builder.addQueryPart("(" + strings.Join(searchConditions, " OR ") + ")")
			}

			continue
		}

		processCondition(condition, collectionMetadata, builder)

	}

	return nil
}
