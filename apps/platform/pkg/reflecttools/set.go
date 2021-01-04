package reflecttools

import (
	"errors"
	"fmt"
	"reflect"
)

// SetField sets the provided obj field with provided value. obj param has
// to be a pointer to a struct, otherwise it will soundly fail. Provided
// value type should match with the struct field you're trying to set.
func SetField(obj interface{}, name string, value interface{}) error {

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
	for i := 0; i < from.Len(); i++ {
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
	if fromKind != reflect.Map {
		return fmt.Errorf("Cannot set kind: %s to struct", fromKind)
	}
	for _, key := range from.MapKeys() {
		fieldName, err := getFieldName(structType, key.String())
		if err != nil {
			return err
		}
		err = setFieldReflect(to.FieldByName(fieldName), from.MapIndex(key).Elem())
		if err != nil {
			return err
		}
	}
	return nil
}

func setPrimative(to reflect.Value, from reflect.Value) error {
	if to.Type() != from.Type() {
		invalidTypeError := errors.New("Provided value type didn't match obj field type: " + to.Type().String() + " : " + from.Type().String())
		return invalidTypeError
	}

	to.Set(from)
	return nil
}

func setFieldReflect(to reflect.Value, from reflect.Value) error {
	if !from.IsValid() {
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
	}
	return setPrimative(to, from)
}
