package metadata

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// NewField function
func NewField(collectionKey, fieldKey string) (*Field, error) {
	namespace, name, err := ParseKey(fieldKey)
	if err != nil {
		return nil, errors.New("Bad Key for Field: " + collectionKey + " : " + fieldKey)
	}
	return &Field{
		Name:          name,
		Namespace:     namespace,
		CollectionRef: collectionKey,
	}, nil
}

//Validate struct
type Validate struct {
	Type  string `yaml:"type,omitempty" uesio:"Type"`
	Regex string `yaml:"regex,omitempty" uesio:"Regex"`
}

// Field struct
type Field struct {
	ID                   string   `yaml:"-" uesio:"uesio.id"`
	Name                 string   `yaml:"name" uesio:"uesio.name"`
	CollectionRef        string   `yaml:"collection" uesio:"uesio.collection"`
	Namespace            string   `yaml:"-" uesio:"-"`
	Type                 string   `yaml:"type" uesio:"uesio.type"`
	Label                string   `yaml:"label" uesio:"uesio.label"`
	PropertyName         string   `yaml:"propertyName" uesio:"uesio.propertyname"`
	ReadOnly             bool     `yaml:"readOnly,omitempty" uesio:"uesio.readonly"`
	ReferencedCollection string   `yaml:"referencedCollection,omitempty" uesio:"uesio.referencedCollection"`
	SelectList           string   `yaml:"selectList,omitempty" uesio:"uesio.selectlist"`
	ForeignKeyField      string   `yaml:"foreignKeyField,omitempty" uesio:"uesio.foreignKeyField"`
	Workspace            string   `yaml:"-" uesio:"uesio.workspaceid"`
	Required             bool     `yaml:"required,omitempty" uesio:"uesio.required"`
	Validate             Validate `yaml:"validate,omitempty" uesio:"uesio.validate"`
	AutoPopulate         string   `yaml:"autopopulate" uesio:"uesio.autopopulate"`
}

// GetFieldTypes function
func GetFieldTypes() map[string]bool {
	return map[string]bool{
		"TEXT":      true,
		"NUMBER":    true,
		"LONGTEXT":  true,
		"CHECKBOX":  true,
		"SELECT":    true,
		"REFERENCE": true,
		"FILE":      true,
		"IMAGE":     true,
		"ARRAY":     true,
		"DATE":      true,
		"MAP":       true,
		"TIMESTAMP": true,
	}
}

// GetCollectionName function
func (f *Field) GetCollectionName() string {
	return f.GetBundleGroup().GetName()
}

// GetCollection function
func (f *Field) GetCollection() CollectionableGroup {
	var fc FieldCollection
	return &fc
}

// GetConditions function
func (f *Field) GetConditions() ([]adapters.LoadRequestCondition, error) {
	return []adapters.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: f.Name,
		},
		{
			Field: "uesio.collection",
			Value: f.CollectionRef,
		},
	}, nil
}

// GetBundleGroup function
func (f *Field) GetBundleGroup() BundleableGroup {
	var fc FieldCollection
	return &fc
}

// GetKey function
func (f *Field) GetKey() string {
	return f.CollectionRef + "." + f.Namespace + "." + f.Name
}

// GetPath function
func (f *Field) GetPath() string {
	return f.GetKey() + ".yaml"
}

// GetPermChecker function
func (f *Field) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (f *Field) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(f, fieldName, value)
}

// GetField function
func (f *Field) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(f, fieldName)
}

// GetNamespace function
func (f *Field) GetNamespace() string {
	return f.Namespace
}

// SetNamespace function
func (f *Field) SetNamespace(namespace string) {
	f.Namespace = namespace
}

// SetWorkspace function
func (f *Field) SetWorkspace(workspace string) {
	f.Workspace = workspace
}
