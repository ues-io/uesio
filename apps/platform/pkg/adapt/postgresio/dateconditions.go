package postgresio

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func addDateRangeCondition(start, end time.Time, fieldName, fieldType string, builder *QueryBuilder) error {
	if fieldType == "TIMESTAMP" {
		builder.addQueryPart(fmt.Sprintf("%s >= %s", fieldName, builder.addValue(start.Unix())))
		builder.addQueryPart(fmt.Sprintf("%s < %s", fieldName, builder.addValue(end.Unix())))
		return nil
	}
	builder.addQueryPart(fmt.Sprintf("%s >= %s", fieldName, builder.addValue(start.Format("2006-01-02"))))
	builder.addQueryPart(fmt.Sprintf("%s < %s", fieldName, builder.addValue(end.Format("2006-01-02"))))
	return nil
}

func getWeekRange(week, year int) (startDate, endDate time.Time) {
	timeBenchmark := time.Date(year, 7, 1, 0, 0, 0, 0, time.UTC)
	weekStartBenchmark := timeBenchmark.AddDate(0, 0, -(int(timeBenchmark.Weekday()))%7)
	_, weekBenchmark := weekStartBenchmark.ISOWeek()
	startDate = weekStartBenchmark.AddDate(0, 0, (week-(weekBenchmark+1))*7)
	endDate = startDate.AddDate(0, 0, 6)
	return startDate, endDate
}

func processDateRangeCondition(condition wire.LoadRequestCondition, fieldName, fieldType string, builder *QueryBuilder) error {

	value, ok := condition.Value.(string)
	if !ok {
		return errors.New("Invalid date range value")
	}

	if value == "THIS_WEEK" {
		year, month := time.Now().ISOWeek()
		value = fmt.Sprintf("%v-W%v", year, month)
	}

	if value == "THIS_MONTH" {
		value = time.Now().Format("2006-01")
	}
	// Split the condition value on "-"
	dateParts := strings.Split(value, "-")

	// Handle Week Ranges
	if len(dateParts) == 2 && dateParts[1][0] == 'W' {
		year, err := strconv.Atoi(dateParts[0])
		if err != nil {
			return err
		}
		week, err := strconv.Atoi(dateParts[1][1:])
		if err != nil {
			return err
		}
		start, end := getWeekRange(week, year)
		return addDateRangeCondition(start, end, fieldName, fieldType, builder)
	}

	// Handle Month Ranges
	if len(dateParts) == 2 {
		start, err := time.Parse("2006-01", value)
		if err != nil {
			return err
		}
		end := start.AddDate(0, 1, 0)
		return addDateRangeCondition(start, end, fieldName, fieldType, builder)
	}
	return nil
}

func getTimestampValue(condition wire.LoadRequestCondition) interface{} {
	value, ok := condition.Value.(string)
	if !ok {
		return condition.Value
	}

	if value == "NOW" {
		return time.Now().Unix()
	}

	return condition.Value
}
