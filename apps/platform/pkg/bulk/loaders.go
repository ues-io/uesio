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

		stringvalue := getValue(data, mapping, index)
		numberInt, err := strconv.ParseInt(stringvalue, 10, 64)
		if err != nil {
			numberFloat, err := strconv.ParseFloat(stringvalue, 64)
			if err != nil {
				return
			}
			println("Float", numberFloat)
			change[fieldMetadata.GetFullName()] = numberFloat
			return
		}
		println("Int", numberInt)
		change[fieldMetadata.GetFullName()] = numberInt

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
	if mapping.MatchField == "" {
		return getTextLoader(index, mapping, fieldMetadata, getValue)
	}
	return func(change adapt.Item, data interface{}) {
		change[fieldMetadata.GetFullName()] = map[string]interface{}{
			mapping.MatchField: getValue(data, mapping, index),
		}
	}
}
