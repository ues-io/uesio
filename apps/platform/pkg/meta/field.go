package meta

import (
	"errors"
	"path/filepath"
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

// SubField struct
type SubField struct {
	Name string `uesio:"name"`
}

// Field struct
type Field struct {
	ID                   string     `yaml:"-" uesio:"studio.id"`
	Name                 string     `yaml:"name" uesio:"studio.name"`
	CollectionRef        string     `yaml:"collection" uesio:"studio.collection"`
	Namespace            string     `yaml:"-" uesio:"-"`
	Type                 string     `yaml:"type" uesio:"studio.type"`
	Label                string     `yaml:"label" uesio:"studio.label"`
	ReadOnly             bool       `yaml:"readOnly,omitempty" uesio:"studio.readonly"`
	CreateOnly           bool       `yaml:"createOnly,omitempty" uesio:"studio.createonly"`
	ReferencedCollection string     `yaml:"referencedCollection,omitempty" uesio:"studio.referencedCollection"`
	SelectList           string     `yaml:"selectList,omitempty" uesio:"studio.selectlist"`
	Workspace            *Workspace `yaml:"-" uesio:"studio.workspace"`
	Required             bool       `yaml:"required,omitempty" uesio:"studio.required"`
	Validate             Validate   `yaml:"validate,omitempty" uesio:"studio.validate"`
	AutoPopulate         string     `yaml:"autopopulate,omitempty" uesio:"studio.autopopulate"`
	OnDelete             string     `yaml:"ondelete,omitempty" uesio:"studio.ondelete"`
	FileCollection       string     `yaml:"filecollection,omitempty" uesio:"studio.filecollection"`
	Accept               string     `yaml:"accept,omitempty" uesio:"studio.accept"`
	itemMeta             *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy            *User      `yaml:"-" uesio:"studio.createdby"`
	UpdatedBy            *User      `yaml:"-" uesio:"studio.updatedby"`
	UpdatedAt            int64      `yaml:"-" uesio:"studio.updatedat"`
	CreatedAt            int64      `yaml:"-" uesio:"studio.createdat"`
	SubFields            []SubField `yaml:"subfields,omitempty" uesio:"studio.subfields"`
	SubType              string     `yaml:"subtype,omitempty" uesio:"studio.subtype"`
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
		"USER":      true,
		"LIST":      true,
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
func (f *Field) GetConditions() map[string]string {
	return map[string]string{
		"studio.name":       f.Name,
		"studio.collection": f.CollectionRef,
	}
}

// GetBundleGroup function
func (f *Field) GetBundleGroup() BundleableGroup {
	var fc FieldCollection
	return &fc
}

// GetKey function
func (f *Field) GetKey() string {
	return filepath.Join(f.CollectionRef, f.Namespace+"."+f.Name)
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
	f.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (f *Field) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(f, iter)
}

// Len function
func (f *Field) Len() int {
	return StandardItemLen(f)
}

// GetItemMeta function
func (f *Field) GetItemMeta() *ItemMeta {
	return f.itemMeta
}

// SetItemMeta function
func (f *Field) SetItemMeta(itemMeta *ItemMeta) {
	f.itemMeta = itemMeta
}
