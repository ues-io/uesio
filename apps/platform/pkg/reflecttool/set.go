package reflecttool

import (
	"errors"
	"fmt"
	"reflect"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
)

// SetField sets the provided obj field with provided value. obj param has
// to be a pointer to a struct, otherwise it will soundly fail. Provided
// value type should match with the struct field you're trying to set.
func SetField(obj any, name string, value any) error {

	structValue := reflect.ValueOf(obj).Elem()
	structKind := structValue.Kind()
	structType := structValue.Type()
	if structKind != reflect.Struct {
		return errors.New("Cannot use SetField on a non-struct interface")
	}
	fieldName, err := getFieldName(structType, name)
	if err != nil {
		return err
	}

	err = setFieldReflect(structValue.FieldByName(fieldName), reflect.ValueOf(value))
	if err != nil {
		return fmt.Errorf("%v: %s", err, name)
	}
	return nil
}

func setSlice(to reflect.Value, from reflect.Value) error {
	sliceType := to.Type()
	itemType := sliceType.Elem()
	// Verify that from's type is a slice so we don't have a panic
	fromKind := from.Kind()
	if fromKind != reflect.Slice {
		return fmt.Errorf("Cannot set kind: %s to slice", fromKind)
	}
	for i := range from.Len() {
		newItem := reflect.Indirect(reflect.New(itemType))
		err := setFieldReflect(newItem, from.Index(i).Elem())
		if err != nil {
			return err
		}
		to.Set(reflect.Append(to, newItem))
	}
	return nil
}

func setMap(to reflect.Value, from reflect.Value) error {
	mapType := to.Type()
	itemType := mapType.Elem()
	// Verify that from's type is a map so we don't have a panic
	fromKind := from.Kind()
	if fromKind != reflect.Map {
		return fmt.Errorf("Cannot set kind: %s to map", fromKind)
	}
	for _, key := range from.MapKeys() {
		newItem := reflect.Indirect(reflect.New(itemType))
		err := setFieldReflect(newItem, from.MapIndex(key).Elem())
		if err != nil {
			return err
		}
		if to.IsNil() {
			to.Set(reflect.MakeMap(mapType))
		}
		to.SetMapIndex(key, newItem)
	}
	return nil
}

func setStruct(to reflect.Value, from reflect.Value) error {
	structType := to.Type()
	// Verify that from's type is a map so we don't have a panic
	fromKind := from.Kind()
	if fromKind == reflect.Ptr {
		from = from.Elem()
		fromKind = from.Kind()
	}
	if fromKind == reflect.Struct {
		to.Set(from)
		return nil
	}
	if fromKind != reflect.Map {
		return fmt.Errorf("Cannot set kind: %s to a %s struct", fromKind, structType)
	}
	for _, key := range from.MapKeys() {
		fieldName, err := getFieldName(structType, key.String())
		if err != nil {
			// If we can't find this field in our struct, don't panic!
			// Just continue. We are ok with extra data
			continue
		}
		err = setFieldReflect(to.FieldByName(fieldName), from.MapIndex(key).Elem())
		if err != nil {
			return err
		}
	}
	return nil
}

func setPointer(to reflect.Value, from reflect.Value) error {
	fromKind := from.Kind()
	// Special handling for strings, just set the id field.
	if fromKind == reflect.String {
		from = reflect.ValueOf(map[string]any{
			commonfields.Id: from.String(),
		})
	}
	if from.IsNil() {
		to.Set(reflect.Zero(to.Type()))
		return nil
	}
	value := reflect.New(to.Type().Elem())
	to.Set(value)
	return setFieldReflect(value.Elem(), from)
}

func setPrimative(to reflect.Value, from reflect.Value) error {
	fromType := from.Type()
	toType := to.Type()
	if !fromType.AssignableTo(toType) {
		if from.CanConvert(toType) {
			to.Set(from.Convert(toType))
			return nil
		}
		// A special case where we try to convert strings to int.
		if fromType == reflect.TypeOf("") && toType == reflect.TypeOf(0) {
			stringVal := from.String()
			intVal, err := strconv.Atoi(stringVal)
			if err != nil {
				return err
			}
			to.Set(reflect.ValueOf(intVal))
			fmt.Println("WARNING: converted string to int: " + stringVal)
			return nil
		}
		return errors.New("Provided value type didn't match obj field type: " + to.Type().String() + " : " + from.Type().String())
	}

	to.Set(from)
	return nil
}

func setFieldReflect(to reflect.Value, from reflect.Value) error {
	if !from.IsValid() {
		to.Set(reflect.Zero(to.Type()))
		return nil
	}

	if !to.IsValid() {
		return fmt.Errorf("No such field")
	}

	if !to.CanSet() {
		return fmt.Errorf("Cannot set")
	}

	switch to.Kind() {
	case reflect.Slice:
		return setSlice(to, from)
	case reflect.Map:
		return setMap(to, from)
	case reflect.Struct:
		return setStruct(to, from)
	case reflect.Ptr:
		return setPointer(to, from)
	}
	return setPrimative(to, from)
}
