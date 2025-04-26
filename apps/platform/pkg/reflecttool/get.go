package reflecttool

import (
	"errors"
	"fmt"
	"reflect"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant"
)

func ReflectValue(obj any) reflect.Value {
	objType := reflect.TypeOf(obj)
	if objType != nil && objType.Kind() == reflect.Ptr {
		return reflect.ValueOf(obj).Elem()
	}
	return reflect.ValueOf(obj)
}

// GetField returns the value of the provided obj field. obj can either
// be a structure or pointer to structure.
func GetField(obj any, name string) (any, error) {

	// Split the field name into tokens
	names := strings.SplitSeq(name, constant.RefSep)

	for name := range names {

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
			return nil, errors.New("cannot use GetField on a non-struct interface")
		}

		fieldName, err := getFieldName(objType, name)
		if err != nil {
			return nil, err
		}

		obj, err = getFieldReflect(objValue.FieldByName(fieldName))
		if err != nil {
			return nil, fmt.Errorf("%w: %s", err, name)
		}
	}

	return obj, nil

}

func getPointer(from reflect.Value) (any, error) {
	if from.IsNil() {
		return nil, nil
	}

	return from.Interface(), nil
}

func getFieldReflect(value reflect.Value) (any, error) {

	if !value.IsValid() {
		return nil, errors.New("no such field")
	}

	switch value.Kind() {
	case reflect.Ptr:
		return getPointer(value)

	}

	return value.Interface(), nil
}
