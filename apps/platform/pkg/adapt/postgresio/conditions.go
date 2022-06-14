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

func IsValid(lrc adapt.LoadRequestCondition) error {

	//TO-DO check if the condition is the first and has Conjunction --> error

	switch lrc.Operator {
	case "IN":
		_, ok := lrc.Value.([]string)
		if !ok {
			return errors.New("Invalid IN condition value")
		}

	case "NOT_EQ":

	case "GT":
		_, ok := lrc.Value.(bool)
		if !ok {
			return errors.New("Invalid GT condition value")
		}
	case "LT":
		_, ok := lrc.Value.(bool)
		if !ok {
			return errors.New("Invalid GT condition value")
		}
	case "GTE":
		_, ok := lrc.Value.(bool)
		if !ok {
			return errors.New("Invalid GT condition value")
		}
	case "LTE":
		_, ok := lrc.Value.(bool)
		if !ok {
			return errors.New("Invalid GT condition value")
		}
	case "IS_BLANK":

	case "IS_NOT_BLANK":

	}

	return nil
}

func getValues(lrc adapt.LoadRequestCondition, fieldName string, paramCounter *ParamCounter) (string, interface{}) {

	conjunction := "AND"
	if lrc.Conjunction != "" {
		conjunction = lrc.Conjunction
	}

	switch lrc.Operator {
	case "IN":
		return conjunction + " " + fieldName + " = ANY(" + paramCounter.get() + ")", lrc.Value

	case "NOT_EQ":
		return conjunction + " " + fieldName + " is distinct from " + paramCounter.get(), lrc.Value

	case "GT":
		return conjunction + " " + fieldName + " > " + paramCounter.get(), lrc.Value

	case "LT":
		return conjunction + " " + fieldName + " < " + paramCounter.get(), lrc.Value

	case "GTE":
		return conjunction + " " + fieldName + " >= " + paramCounter.get(), lrc.Value

	case "LTE":
		return conjunction + " " + fieldName + " <= " + paramCounter.get(), lrc.Value

	case "IS_BLANK":
		return conjunction + " " + fieldName + " IS NULL ", nil

	case "IS_NOT_BLANK":
		return conjunction + " " + fieldName + " IS NOT NULL ", nil

	default:
		return conjunction + " " + fieldName + " = " + paramCounter.get(), lrc.Value

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

	// Shortcut optimization
	// if len(op.Conditions) == 1 && op.Conditions[0].Field == adapt.ID_FIELD && (op.Conditions[0].Operator == "IN" || op.Conditions[0].Operator == "EQ") {
	// 	return idConditionOptimization(&op.Conditions[0], collectionName)
	// }

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
				conditionStrings = append(conditionStrings, "AND ("+strings.Join(searchConditions, " OR ")+")")
			}

			continue
		}

		err := IsValid(condition)
		if err != nil {
			return nil, nil, err
		}

		fieldMetadata, err := collectionMetadata.GetField(condition.Field)
		if err != nil {
			return nil, nil, err
		}

		fieldName := getFieldName(fieldMetadata)
		conditionString, value := getValues(condition, fieldName, paramCounter)
		conditionStrings = append(conditionStrings, conditionString)
		if value != nil {
			values = append(values, value)
		}

	}

	return conditionStrings, values, nil
}
