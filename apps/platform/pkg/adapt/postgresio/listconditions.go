package postgresio

import (
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func processListCondition(condition adapt.LoadRequestCondition, fieldName string, builder *QueryBuilder, fieldMetadata *adapt.FieldMetadata) error {
	operator := condition.Operator
	fsubtype := fieldMetadata.SubType
	if fsubtype != "TEXT" {
		return errors.New(fmt.Sprintf("Conditions for a list field with sup type %s are not supported. Conditions are just supported for a list field with sub type 'TEXT'.", fsubtype))
	}
	if operator != "IN" && operator != "NOT_IN" {
		return errors.New(fmt.Sprintf("The Operator %s is not supported for a list field. Supported operators are 'IN' and 'NOT_IN'.", operator))
	}
	safeValues := ProcessConditionValues(condition, builder)
	prefix := ""
	useOperator := "@>"
	if condition.Operator == "NOT_IN" {
		prefix = "NOT"
	}
	if condition.ValueSource != "LOOKUP" {
		useOperator = "?|"
		builder.addQueryPart(fmt.Sprintf("%s %s %s array[%s]", prefix, fieldName, useOperator, strings.Join(safeValues, ",")))
	} else {
		for _, value := range safeValues {
			builder.addQueryPart(fmt.Sprintf("%s %s %s %s", prefix, fieldName, useOperator, value))
		}
	}
	return nil
}
