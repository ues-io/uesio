package metadata

import (
	"errors"
)

// FieldCollection slice
type FieldCollection []Field

// GetName function
func (fc *FieldCollection) GetName() string {
	return "fields"
}

// GetFields function
func (fc *FieldCollection) GetFields() []string {
	return []string{"id", "name", "label", "collection", "propertyname", "type", "selectlist", "foreignKeyField", "referencedCollection"}
}

// NewItem function
func (fc *FieldCollection) NewItem() BundleableItem {
	var field Field
	return &field
}

// AddItem function
func (fc *FieldCollection) AddItem(item BundleableItem) {
	actual := *fc
	field := item.(*Field)
	actual = append(actual, *field)
	*fc = actual
}

// UnMarshal function
func (fc *FieldCollection) UnMarshal(data []map[string]interface{}) error {
	err := StandardDecoder(fc, data)
	if err != nil {
		return err
	}
	err = fc.Validate()
	if err != nil {
		return err
	}
	return nil
}

// Marshal function
func (fc *FieldCollection) Marshal() ([]map[string]interface{}, error) {
	err := fc.Validate()
	if err != nil {
		return nil, err
	}
	return StandardEncoder(fc)
}

// Validate function
func (fc *FieldCollection) Validate() error {
	// Validate required fields and types
	for _, field := range *fc {
		// make sure field type is valid
		_, ok := GetFieldTypes()[field.Type]
		if !ok {
			return errors.New("Invalid Field Type: " + field.Type)
		}
	}
	return nil
}

// GetItem function
func (fc *FieldCollection) GetItem(index int) CollectionableItem {
	actual := *fc
	return &actual[index]
}
