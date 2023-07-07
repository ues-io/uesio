package postgresio

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func processStructCondition(condition adapt.LoadRequestCondition, fieldName string, builder *QueryBuilder, fieldMetadata *adapt.FieldMetadata, safeValues []string) error {
	operator := condition.Operator
	fsubtype := fieldMetadata.SubType
	if fsubtype != "TEXT" {
		return errors.New(fmt.Sprintf("Conditions for a list field with sup type %s are not supported. Conditions are just supported for a list field with sub type 'TEXT'.", fsubtype))
	}
	if operator != "IN" && operator != "NOT_IN" {
		return errors.New(fmt.Sprintf("The Operator %s is not supported for a list field. Supported operators are 'IN' and 'NOT_IN'.", operator))
	}
	// safeValues := ProcessConditionValues(condition, builder)
	prefix := ""
	if condition.Operator == "NOT_IN" {
		prefix = "NOT"
	}
	for _, value := range safeValues {
		builder.addQueryPart(fmt.Sprintf("%s %s @> %s", prefix, fieldName, value))
	}
	return nil
}
