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

		objValue := reflectValue(obj)
		objKind := objValue.Kind()
		objType := objValue.Type()
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
	structFieldType := from.Type()
	returnMap := map[string]interface{}{}
	uesioNames, err := getFieldNamesReflect(structFieldType)
	if err != nil {
		return nil, err
	}
	for _, uesioName := range uesioNames {
		fieldName, err := getFieldName(structFieldType, uesioName)
		if err != nil {
			return nil, err
		}
		val, err := getFieldReflect(from.FieldByName(fieldName))
		if err != nil {
			return nil, err
		}
		returnMap[uesioName] = val
	}
	return returnMap, nil
}

func getPointer(from reflect.Value) (interface{}, error) {
	if from.IsNil() {
		return nil, nil
	}
	return getFieldReflect(from.Elem())
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
