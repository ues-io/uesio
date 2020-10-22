package metadata

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/reqs"
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

// Field struct
type Field struct {
	Name                 string `yaml:"name" uesio:"uesio.name"`
	CollectionRef        string `yaml:"collection" uesio:"uesio.collection"`
	Namespace            string `yaml:"namespace" uesio:"-"`
	Type                 string `yaml:"type" uesio:"uesio.type"`
	Label                string `yaml:"label" uesio:"uesio.label"`
	PropertyName         string `yaml:"propertyName" uesio:"uesio.propertyname"`
	ReadOnly             bool   `yaml:"readOnly" uesio:"-"`
	ReferencedCollection string `yaml:"referencedCollection" uesio:"uesio.referencedCollection"`
	SelectList           string `yaml:"selectList" uesio:"uesio.selectlist"`
	ForeignKeyField      string `yaml:"foreignKeyField" uesio:"uesio.foreignKeyField"`
	Workspace            string `yaml:"-" uesio:"uesio.workspaceid"`
}

// GetFieldTypes function
func GetFieldTypes() map[string]bool {
	return map[string]bool{
		"TEXT":      true,
		"LONGTEXT":  true,
		"SELECT":    true,
		"REFERENCE": true,
		"CHECKBOX":  true,
		"ARRAY":     true,
		"FILE":      true,
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
func (f *Field) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
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

// GetPermChecker function
func (f *Field) GetPermChecker() *PermissionSet {
	return nil
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
