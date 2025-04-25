package reflecttool

import (
	"errors"
	"reflect"
	"strings"
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

func GetFieldNames(obj any) ([]string, error) {
	structValue := ReflectValue(obj)
	structKind := structValue.Kind()
	structType := structValue.Type()
	if structKind != reflect.Struct {
		return nil, errors.New("Cannot use GetFieldNames on a non-struct interface")
	}
	tags, err := getTags(structType)
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

	allTags := map[string]string{}
	addTags(allTags, objType)

	lock.Lock()
	tagCache[objType] = allTags
	lock.Unlock()

	return allTags, nil
}

func addTags(tagMap map[string]string, objType reflect.Type) {
	fieldsCount := objType.NumField()
	for i := range fieldsCount {
		structField := objType.Field(i)
		// PkgPath is empty for exported fields.
		if structField.PkgPath == "" {
			if structField.Anonymous {
				addTags(tagMap, structField.Type)
			}
			tag := structField.Tag.Get("json")
			if tag == "-" || tag == "" {
				continue
			}
			parts := strings.Split(tag, ",")
			tagMap[parts[0]] = structField.Name
		}
	}
}
