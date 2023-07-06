package postgresio

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func processListCondition(condition adapt.LoadRequestCondition, fieldName string, builder *QueryBuilder, safeValues []string, fieldMetadata *adapt.FieldMetadata) {
	fsubtype := fieldMetadata.SubType
	prefix := ""
	useOperator := "@>"
	if condition.Operator == "NOT_IN" {
		prefix = "NOT"
	}
	if fsubtype == "TEXT" && condition.ValueSource != "LOOKUP" {
		useOperator = "?|"
		builder.addQueryPart(fmt.Sprintf("%s %s %s array[%s]", prefix, fieldName, useOperator, strings.Join(safeValues, ",")))
	} else {
		for _, value := range safeValues {
			builder.addQueryPart(fmt.Sprintf("%s %s %s %s", prefix, fieldName, useOperator, value))
		}
	}
}
