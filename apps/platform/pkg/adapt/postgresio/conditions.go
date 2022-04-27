package postgresio

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

type ParamCounter struct {
	Counter int
}

func (pc *ParamCounter) get() string {
	count := "$" + strconv.Itoa(pc.Counter)
	pc.Counter++
	return count
}

func NewParamCounter(start int) *ParamCounter {
	return &ParamCounter{
		Counter: start,
	}
}

func idConditionOptimization(condition *adapt.LoadRequestCondition, collectionName string) ([]string, []interface{}, error) {
	if condition.Operator != "IN" {
		return []string{"main.id = $1"}, []interface{}{fmt.Sprintf("%s:%s", collectionName, condition.Value)}, nil
	}

	values := condition.Value.([]string)
	if len(values) == 1 {
		return []string{"main.id = $1"}, []interface{}{fmt.Sprintf("%s:%s", collectionName, values[0])}, nil
	}

	appendedValues := make([]string, len(values))
	for i, v := range values {
		appendedValues[i] = fmt.Sprintf("%s:%s", collectionName, v)
	}
	return []string{"main.id = ANY($1)"}, []interface{}{appendedValues}, nil
}

func getConditions(
	op *adapt.LoadOp,
	metadata *adapt.MetadataCache,
	collectionMetadata *adapt.CollectionMetadata,
	credentials *adapt.Credentials,
	paramCounter *ParamCounter,
) ([]string, []interface{}, error) {

	tenantID := credentials.GetTenantIDForCollection(collectionMetadata.GetFullName())

	collectionName, err := getDBCollectionName(collectionMetadata, tenantID)
	if err != nil {
		return nil, nil, err
	}

	// Shortcut optimization when we only ask for the id field
	if len(op.Conditions) == 1 && op.Conditions[0].Field == adapt.ID_FIELD {
		return idConditionOptimization(&op.Conditions[0], collectionName)
	}

	conditionStrings := []string{"main.collection = $1"}

	values := []interface{}{collectionName}

	for _, condition := range op.Conditions {

		if condition.Type == "SEARCH" {
			nameFieldMetadata, err := collectionMetadata.GetNameField()
			if err != nil {
				return nil, nil, err
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
					return nil, nil, err
				}
				searchFields[getFieldName(fieldMetadata)] = true
			}
			// Split the search token on spaces to tokenize the search
			tokens := strings.Fields(searchToken)
			for _, token := range tokens {
				searchConditions := []string{}
				paramNumber := paramCounter.get()
				for field := range searchFields {
					searchConditions = append(searchConditions, field+" ILIKE "+paramNumber)
				}
				values = append(values, fmt.Sprintf("%%%v%%", token))
				conditionStrings = append(conditionStrings, "("+strings.Join(searchConditions, " OR ")+")")
			}

			continue
		}

		fieldMetadata, err := collectionMetadata.GetField(condition.Field)
		if err != nil {
			return nil, nil, err
		}
		fieldName := getFieldName(fieldMetadata)

		conditionValue := condition.Value

		if condition.Operator == "IN" {
			conditions, ok := conditionValue.([]string)
			if !ok {
				return nil, nil, errors.New("Invalid IN condition value")
			}
			if len(conditions) == 1 {
				conditionStrings = append(conditionStrings, fieldName+" = "+paramCounter.get())
				values = append(values, conditions[0])
				continue
			}
			conditionStrings = append(conditionStrings, fieldName+" = ANY("+paramCounter.get()+")")
			values = append(values, conditionValue)
		} else {
			conditionStrings = append(conditionStrings, fieldName+" = "+paramCounter.get())
			values = append(values, conditionValue)
		}
	}

	return conditionStrings, values, nil
}
