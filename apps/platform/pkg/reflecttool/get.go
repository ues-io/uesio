package reflecttool

import (
	"errors"
	"fmt"
	"reflect"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant"
)

func ReflectValue(obj interface{}) reflect.Value {
	objType := reflect.TypeOf(obj)
	if objType != nil && objType.Kind() == reflect.Ptr {
		return reflect.ValueOf(obj).Elem()
	}
	return reflect.ValueOf(obj)
}

// GetField returns the value of the provided obj field. obj can either
// be a structure or pointer to structure.
func GetField(obj interface{}, name string) (interface{}, error) {

	// Split the field name into tokens
	names := strings.Split(name, constant.RefSep)

	for _, name := range names {

		if obj == nil {
			return nil, errors.New("invalid map value")
		}

		objValue := ReflectValue(obj)
		objKind := objValue.Kind()
		objType := objValue.Type()
		if objKind == reflect.Map {
			mapValue := objValue.MapIndex(reflect.ValueOf(name))
			if !mapValue.IsValid() {
				return nil, errors.New("bad value here")
			}
			obj = mapValue.Interface()
			continue
		}
		if objKind != reflect.Struct && objKind != reflect.Ptr {
			return nil, errors.New("Cannot use GetField on a non-struct interface")
		}

		fieldName, err := getFieldName(objType, name)
		if err != nil {
			return nil, err
		}

		obj, err = getFieldReflect(objValue.FieldByName(fieldName))
		if err != nil {
			return nil, fmt.Errorf("%v: %s", err, name)
		}
	}

	return obj, nil

}

func getPointer(from reflect.Value) (interface{}, error) {
	if from.IsNil() {
		return nil, nil
	}

	return from.Interface(), nil
}

func getFieldReflect(value reflect.Value) (interface{}, error) {

	if !value.IsValid() {
		return nil, fmt.Errorf("No such field")
	}

	switch value.Kind() {
	case reflect.Ptr:
		return getPointer(value)

	}

	return value.Interface(), nil
}
