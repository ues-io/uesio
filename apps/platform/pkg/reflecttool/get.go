package reflecttool

import (
	"errors"
	"fmt"
	"reflect"
	"strings"
)

func reflectValue(obj interface{}) reflect.Value {
	if reflect.TypeOf(obj).Kind() == reflect.Ptr {
		return reflect.ValueOf(obj).Elem()
	}
	return reflect.ValueOf(obj)
}

// GetField returns the value of the provided obj field. obj can either
// be a structure or pointer to structure.
func GetField(obj interface{}, name string) (interface{}, error) {

	// Split the field name into tokens
	names := strings.Split(name, "->")

	for _, name := range names {

		if obj == nil {
			return nil, errors.New("invalid map value")
		}

		objValue := reflectValue(obj)
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

func Get(obj interface{}) (interface{}, error) {
	return getFieldReflect(reflectValue(obj))
}

func getSlice(from reflect.Value) (interface{}, error) {
	returnSlice := []interface{}{}
	for i := 0; i < from.Len(); i++ {
		val, err := getFieldReflect(from.Index(i))
		if err != nil {
			return nil, err
		}
		returnSlice = append(returnSlice, val)
	}
	return returnSlice, nil
}

func getMap(from reflect.Value) (interface{}, error) {
	returnMap := map[string]interface{}{}
	iter := from.MapRange()
	for iter.Next() {
		k := iter.Key()
		v := iter.Value()
		val, err := getFieldReflect(v)
		if err != nil {
			return nil, err
		}
		returnMap[k.String()] = val
	}
	return returnMap, nil
}

func getStruct(from reflect.Value) (interface{}, error) {

	fieldNames, err := GetFieldNames(from.Interface())
	if err != nil {
		return nil, err
	}
	// Return the value as a map instead of a struct
	returnMap := map[string]interface{}{}
	for _, fieldName := range fieldNames {
		v, err := GetField(from.Interface(), fieldName)
		if err != nil {
			return nil, err
		}
		returnMap[fieldName] = v
	}
	return returnMap, nil
}

func getPointer(from reflect.Value) (interface{}, error) {
	if from.IsNil() {
		return nil, nil
	}

	if reflect.Indirect(from).Kind() == reflect.Struct {
		return getStruct(from)
	}

	return from.Interface(), nil
}

func getFieldReflect(value reflect.Value) (interface{}, error) {

	if !value.IsValid() {
		return nil, fmt.Errorf("No such field")
	}

	switch value.Kind() {
	case reflect.Slice:
		return getSlice(value)
	case reflect.Map:
		return getMap(value)
	case reflect.Struct:
		return getStruct(value)
	case reflect.Ptr:
		return getPointer(value)
	}

	return value.Interface(), nil
}
