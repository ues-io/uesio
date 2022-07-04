package bulk

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type valueFunc func(data interface{}, mapping *meta.FieldMapping, index int) string
type loaderFunc func(change adapt.Item, data interface{})

func getNumberLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) {
		number, err := strconv.ParseFloat(getValue(data, mapping, index), 64)
		if err != nil {
			return
		}
		change[fieldMetadata.GetFullName()] = number
	}
}

func getBooleanLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) {
		change[fieldMetadata.GetFullName()] = getValue(data, mapping, index) == "true"
	}
}

func getTextLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) {
		change[fieldMetadata.GetFullName()] = getValue(data, mapping, index)
	}
}

func getReferenceLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) {
		value := getValue(data, mapping, index)
		if value != "" {
			change[fieldMetadata.GetFullName()] = map[string]interface{}{
				adapt.UNIQUE_KEY_FIELD: value,
			}
		}
	}
}
