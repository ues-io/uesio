package bulk

import (
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/timeutils"
)

type valueFunc func(data interface{}, mapping *meta.FieldMapping, index int) string
type loaderFunc func(change adapt.Item, data interface{}) error

const INVALID_TIMESTAMP_ERROR = "Invalid format for TIMESTAMP field '%s': value '%v' is not valid ISO-8601 UTC datetime or Unix timestamp"

func getNumberLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) error {
		number, err := strconv.ParseFloat(getValue(data, mapping, index), 64)
		if err != nil {
			return errors.New("Invalid number format: " + fieldMetadata.GetFullName() + " : " + err.Error())
		}
		change[fieldMetadata.GetFullName()] = number
		return nil
	}
}

func getBooleanLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) error {
		change[fieldMetadata.GetFullName()] = getValue(data, mapping, index) == "true"
		return nil
	}
}

func getTextLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) error {
		change[fieldMetadata.GetFullName()] = getValue(data, mapping, index)
		return nil
	}
}

func getReferenceLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) error {
		value := getValue(data, mapping, index)
		if value != "" {
			change[fieldMetadata.GetFullName()] = map[string]interface{}{
				adapt.UNIQUE_KEY_FIELD: value,
			}
		}
		return nil
	}
}

// Expected/allowed inputs for CSV/TSV Timestamp imports are:
//   - string: RFC3339 UTC (e.g. 2023-01-29T13:18:39Z)
//   - int64 number of seconds since Unix epoch
//
// Expected output: an int64 representation for a Unix Timestamp
func getTimestampLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) error {
		stringValue := getValue(data, mapping, index)
		// First parse as RFC3339 UTC
		t, err := time.Parse(time.RFC3339, stringValue)
		if err != nil {
			// Try parsing as Unix Timestamp
			int64Val, err := strconv.ParseInt(stringValue, 10, 64)
			if err != nil {
				return errors.New(fmt.Sprintf(INVALID_TIMESTAMP_ERROR, fieldMetadata.GetFullName(), stringValue))
			}
			t = time.Unix(int64Val, 0)
		}
		change[fieldMetadata.GetFullName()] = t.Unix()
		return nil
	}
}

func getDateLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) error {
		stringValue := getValue(data, mapping, index)
		t, err := time.Parse(timeutils.ISO8601Date, stringValue)
		if err != nil {
			return errors.New("Invalid date format: " + fieldMetadata.GetFullName() + " : " + err.Error())
		}

		change[fieldMetadata.GetFullName()] = t.Format(timeutils.ISO8601Date)
		return nil
	}
}
