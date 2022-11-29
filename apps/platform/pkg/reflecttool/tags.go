package reflecttool

import (
	"errors"
	"reflect"
	"sync"
)

func getFieldName(objType reflect.Type, uesioName string) (string, error) {
	tags, err := getTags(objType)
	if err != nil {
		return "", err
	}
	name, ok := tags[uesioName]
	if !ok {
		return "", errors.New("Could not find field: " + uesioName + " : " + objType.String())
	}
	return name, nil
}

func GetFieldNames(obj interface{}) ([]string, error) {
	structValue := reflectValue(obj)
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
	for tag := range tags {
		names[i] = tag
		i++
	}
	return names, nil
}

var lock sync.RWMutex
var tagCache = map[reflect.Type]map[string]string{}

func getTags(objType reflect.Type) (map[string]string, error) {
	lock.RLock()
	cached, ok := tagCache[objType]
	lock.RUnlock()
	if ok {
		return cached, nil
	}
	fieldsCount := objType.NumField()
	allTags := make(map[string]string)
	key := "json"

	for i := 0; i < fieldsCount; i++ {
		structField := objType.Field(i)
		// PkgPath is empty for exported fields.
		if structField.PkgPath == "" {
			tag := structField.Tag.Get(key)
			if tag == "-" || tag == "" {
				continue
			}
			allTags[tag] = structField.Name
		}
	}

	lock.Lock()
	tagCache[objType] = allTags
	lock.Unlock()

	return allTags, nil
}
