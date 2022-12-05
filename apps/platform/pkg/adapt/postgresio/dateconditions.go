package postgresio

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func addDateRangeCondition(start, end time.Time, fieldName string, builder *QueryBuilder) error {
	builder.addQueryPart(fmt.Sprintf("%s >= %s", fieldName, builder.addValue(start.Format("2006-01-02"))))
	builder.addQueryPart(fmt.Sprintf("%s < %s", fieldName, builder.addValue(end.Format("2006-01-02"))))
	return nil
}

func processDateRangeCondition(condition adapt.LoadRequestCondition, fieldName string, builder *QueryBuilder) error {

	value, ok := condition.Value.(string)
	if !ok {
		return errors.New("Invalid date range value")
	}

	if value == "THIS_MONTH" {
		value = time.Now().Format("2006-01")
	}
	// Split the condition value on "-"
	dateParts := strings.Split(value, "-")

	// Handle Month Ranges
	if len(dateParts) == 2 {
		start, err := time.Parse("2006-01", value)
		if err != nil {
			return err
		}
		end := start.AddDate(0, 1, 0)
		return addDateRangeCondition(start, end, fieldName, builder)
	}
	return nil
}
