package bulk

import (
	"encoding/json"
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
const INVALID_NUMBER_ERROR = "Invalid format for NUMBER field '%s': value '%v' is not a valid number"

func getNumberLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) error {
		raw_val := getValue(data, mapping, index)
		float_val, err := strconv.ParseFloat(raw_val, 64)
		if err == nil {
			change[fieldMetadata.GetFullName()] = float_val
			return nil
		}
		return errors.New(fmt.Sprintf(INVALID_NUMBER_ERROR, fieldMetadata.GetFullName(), raw_val))
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
		// If there's no value, there's nothing to do
		if stringValue == "" {
			return nil
		}
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

// Multi-select fields are stored in DB as map[string]bool
// To be concise, but also allow for nested commas/quotes within the Multiselect value,
// we serialize to a JSON array
func getMultiSelectLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) error {
		rawVal := getValue(data, mapping, index)
		valuesMap := map[string]bool{}
		// If there's no data, just do an early return
		if rawVal != "" && rawVal != "[]" {
			maxLen := 0
			if fieldMetadata != nil && fieldMetadata.SelectListMetadata != nil && fieldMetadata.SelectListMetadata.Options != nil {
				maxLen = len(fieldMetadata.SelectListMetadata.Options)
			}
			validVals := make([]string, 0, maxLen)
			err := json.Unmarshal([]byte(rawVal), &validVals)
			if err != nil {
				return errors.New("invalid Multiselect field value")
			}
			if len(validVals) != 0 {
				for _, s := range validVals {
					valuesMap[s] = true
				}
			}
		}
		change[fieldMetadata.GetFullName()] = valuesMap
		return nil
	}
}

// We serialize STRUCT and MAP fields to a JSON object
func getMapLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) error {
		rawVal := getValue(data, mapping, index)
		value := map[string]interface{}{}
		// If there's no data, just use the empty map
		if rawVal != "" && rawVal != "{}" {
			err := json.Unmarshal([]byte(rawVal), &value)
			if err != nil {
				return fmt.Errorf("invalid %s field value", fieldMetadata.Type)
			}
		}
		change[fieldMetadata.GetFullName()] = value
		return nil
	}
}

// We serialize LIST fields to a JSON array
func getListLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) error {
		rawVal := getValue(data, mapping, index)
		value := []interface{}{}
		// If there's no data, just use the empty slice
		if rawVal != "" && rawVal != "[]" {
			err := json.Unmarshal([]byte(rawVal), &value)
			if err != nil {
				return fmt.Errorf("invalid LIST field value")
			}
		}
		change[fieldMetadata.GetFullName()] = value
		return nil
	}
}
