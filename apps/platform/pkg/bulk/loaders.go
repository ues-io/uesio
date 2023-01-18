package bulk

import (
	"errors"
	"strconv"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/timeutils"
)

type valueFunc func(data interface{}, mapping *meta.FieldMapping, index int) string
type loaderFunc func(change adapt.Item, data interface{}) error

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
