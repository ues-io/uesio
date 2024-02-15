package wire

import (
	"errors"
	"fmt"
	"slices"
	"strconv"
	"strings"
)

func GetAggregationFieldNames(aggregateFields []AggregationField, groupByFields []AggregationField, getDBAggregateFieldName func(*AggregationField) string) ([]string, error) {
	if len(aggregateFields) == 0 {
		return nil, errors.New("No aggregate fields selected")
	}

	i := 0
	dbNames := make([]string, len(aggregateFields)+len(groupByFields))
	for _, aggregation := range aggregateFields {
		if aggregation.Function == "" {
			return nil, errors.New("Missing funciton for aggregation field")
		}
		dbNames[i] = getDBAggregateFieldName(&aggregation)
		i++
	}
	for _, aggregation := range groupByFields {
		dbNames[i] = getDBAggregateFieldName(&aggregation)
		i++
	}
	slices.Sort(dbNames)
	return dbNames, nil
}

func GetGroupBySelects(groupByFields []AggregationField, getDBGroupByFieldName func(*AggregationField) string) (string, error) {

	if len(groupByFields) == 0 {
		return "", errors.New("No group by fields selected")
	}

	i := 0
	dbNames := make([]string, len(groupByFields))
	for _, aggregation := range groupByFields {
		dbNames[i] = getDBGroupByFieldName(&aggregation)
		i++
	}
	slices.Sort(dbNames)
	return "," + strings.Join(dbNames, ","), nil
}

func GetGroupByClause(groupByFields []AggregationField, prefix string, getDBGroupByFieldName func(*AggregationField) string) (string, error) {

	if len(groupByFields) == 0 {
		return "", errors.New("No group by fields selected")
	}

	if prefix == "" {
		prefix = "GROUP BY"
	}

	i := 0
	dbNames := make([]string, len(groupByFields))
	for range groupByFields {
		dbNames[i] = strconv.Itoa(i + 2)
		i++
	}
	return fmt.Sprintf("\n%s %s", prefix, strings.Join(dbNames, ", ")), nil

}
