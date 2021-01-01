package metadata

import (
	"errors"
	"fmt"
	"reflect"
)

func hasValidType(obj interface{}, types []reflect.Kind) bool {
	for _, t := range types {
		if reflect.TypeOf(obj).Kind() == t {
			return true
		}
	}

	return false
}

func reflectValue(obj interface{}) reflect.Value {
	var val reflect.Value

	if reflect.TypeOf(obj).Kind() == reflect.Ptr {
		val = reflect.ValueOf(obj).Elem()
	} else {
		val = reflect.ValueOf(obj)
	}

	return val
}

func isExportableField(field reflect.StructField) bool {
	// PkgPath is empty for exported fields.
	return field.PkgPath == ""
}

func getFieldName(obj interface{}, uesioName string) (string, error) {
	tags, err := Tags(obj, "uesio")
	if err != nil {
		return "", err
	}
	for name, tag := range tags {
		if uesioName == tag {
			return name, nil
		}
	}
	return "", errors.New("Could not find field: " + uesioName)
}

func getFieldNameFromType(objType reflect.Type, uesioName string) (string, error) {
	tags, err := TagsFromType(objType, "uesio")
	if err != nil {
		return "", err
	}
	for name, tag := range tags {
		if uesioName == tag {
			return name, nil
		}
	}
	return "", errors.New("Could not find field: " + uesioName)
}

// GetField returns the value of the provided obj field. obj can whether
// be a structure or pointer to structure.
func GetField(obj interface{}, name string) (interface{}, error) {
	if !hasValidType(obj, []reflect.Kind{reflect.Struct, reflect.Ptr}) {
		return nil, errors.New("Cannot use GetField on a non-struct interface")
	}

	fieldName, err := getFieldName(obj, name)
	if err != nil {
		return nil, err
	}

	objValue := reflectValue(obj)
	field := objValue.FieldByName(fieldName)
	if !field.IsValid() {
		return nil, fmt.Errorf("No such field: %s in obj", name)
	}

	return field.Interface(), nil
}

// SetField sets the provided obj field with provided value. obj param has
// to be a pointer to a struct, otherwise it will soundly fail. Provided
// value type should match with the struct field you're trying to set.
func SetField(obj interface{}, name string, value interface{}) error {

	fieldName, err := getFieldName(obj, name)
	if err != nil {
		return err
	}
	// Fetch the field reflect.Value
	structValue := reflect.ValueOf(obj).Elem()
	structFieldValue := structValue.FieldByName(fieldName)

	if !structFieldValue.IsValid() {
		return fmt.Errorf("No such field: %s in obj", name)
	}

	// If obj field value is not settable an error is thrown
	if !structFieldValue.CanSet() {
		return fmt.Errorf("Cannot set %s field value", name)
	}

	return setFieldReflect(structFieldValue, reflect.ValueOf(value))
}

func setFieldReflect(structFieldValue reflect.Value, val reflect.Value) error {
	if !val.IsValid() {
		return nil
	}
	structFieldType := structFieldValue.Type()
	structFieldKind := structFieldValue.Kind()

	if structFieldKind == reflect.Slice {
		itemType := structFieldType.Elem()
		for i := 0; i < val.Len(); i++ {
			newItem := reflect.Indirect(reflect.New(itemType))
			err := setFieldReflect(newItem, val.Index(i).Elem())
			if err != nil {
				return err
			}
			structFieldValue.Set(reflect.Append(structFieldValue, newItem))
		}
		return nil
	}

	if structFieldKind == reflect.Map {
		itemType := structFieldType.Elem()
		for _, key := range val.MapKeys() {
			newItem := reflect.Indirect(reflect.New(itemType))
			err := setFieldReflect(newItem, val.MapIndex(key).Elem())
			if err != nil {
				return err
			}
			if structFieldValue.IsNil() {
				structFieldValue.Set(reflect.MakeMap(structFieldType))
			}
			structFieldValue.SetMapIndex(key, newItem)
		}
		return nil
	}

	if structFieldKind == reflect.Struct {
		for _, key := range val.MapKeys() {
			fieldName, err := getFieldNameFromType(structFieldType, key.String())
			if err != nil {
				return err
			}
			err = setFieldReflect(structFieldValue.FieldByName(fieldName), val.MapIndex(key).Elem())
			if err != nil {
				return err
			}
		}
		return nil
	}

	if structFieldType != val.Type() {
		invalidTypeError := errors.New("Provided value type didn't match obj field type: " + structFieldType.String() + " : " + val.Type().String())
		return invalidTypeError
	}

	structFieldValue.Set(val)
	return nil
}

func Tags(obj interface{}, key string) (map[string]string, error) {
	if !hasValidType(obj, []reflect.Kind{reflect.Struct, reflect.Ptr}) {
		return nil, errors.New("Cannot use GetField on a non-struct interface")
	}
	objValue := reflectValue(obj)
	return TagsFromType(objValue.Type(), key)
}

func TagsFromType(objType reflect.Type, key string) (map[string]string, error) {
	fieldsCount := objType.NumField()
	allTags := make(map[string]string)

	for i := 0; i < fieldsCount; i++ {
		structField := objType.Field(i)
		if isExportableField(structField) {
			allTags[structField.Name] = structField.Tag.Get(key)
		}
	}

	return allTags, nil
}
