package reflecttools

import (
	"errors"
	"reflect"
)

func getFieldName(objType reflect.Type, uesioName string) (string, error) {
	tags, err := getTags(objType)
	if err != nil {
		return "", err
	}
	for name, tag := range tags {
		if uesioName == tag {
			return name, nil
		}
	}
	return "", errors.New("Could not find field: " + uesioName + " : " + objType.String())
}

func GetFieldNames(obj interface{}) ([]string, error) {
	structValue := reflect.ValueOf(obj).Elem()
	structKind := structValue.Kind()
	structType := structValue.Type()
	if structKind != reflect.Struct {
		return nil, errors.New("Cannot use GetFieldNames on a non-struct interface")
	}
	return getFieldNamesReflect(structType)
}

func getFieldNamesReflect(objType reflect.Type) ([]string, error) {
	tags, err := getTags(objType)
	if err != nil {
		return nil, err
	}
	names := make([]string, len(tags))
	i := 0
	for _, tag := range tags {
		names[i] = tag
		i++
	}
	return names, nil
}

var tagCache = map[reflect.Type]map[string]string{}

func getTags(objType reflect.Type) (map[string]string, error) {
	cached, ok := tagCache[objType]
	if ok {
		return cached, nil
	}
	fieldsCount := objType.NumField()
	allTags := make(map[string]string)
	key := "uesio"

	for i := 0; i < fieldsCount; i++ {
		structField := objType.Field(i)
		// PkgPath is empty for exported fields.
		if structField.PkgPath == "" {
			tag := structField.Tag.Get(key)
			if tag == "-" || tag == "" {
				continue
			}
			allTags[structField.Name] = tag
		}
	}

	tagCache[objType] = allTags

	return allTags, nil
}
