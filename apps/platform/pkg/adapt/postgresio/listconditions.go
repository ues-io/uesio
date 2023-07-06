package postgresio

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func processListCondition(condition adapt.LoadRequestCondition, fieldName string, builder *QueryBuilder, safeValues []string) {
	prefix := ""
	useOperator := "@>"
	if condition.Operator == "NOT_IN" {
		prefix = "NOT"
	}
	for _, value := range safeValues {
		builder.addQueryPart(fmt.Sprintf("%s %s %s %s", prefix, fieldName, useOperator, value))
	}
}
