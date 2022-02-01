package meta

import (
	"errors"
	"fmt"
	"path/filepath"

	"github.com/humandad/yaml"
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

//ValidationMetadata struct
type ValidationMetadata struct {
	Type  string `json:"type" yaml:"type,omitempty" uesio:"studio.type"`
	Regex string `json:"regex" yaml:"regex,omitempty" uesio:"studio.regex"`
}

// SubField struct
type SubField struct {
	Name       string `yaml:"name,omitempty" uesio:"studio.name"`
	Label      string `yaml:"label,omitempty" uesio:"studio.label"`
	Type       string `yaml:"type,omitempty" uesio:"studio.type"`
	SelectList string `yaml:"selectList,omitempty" uesio:"studio.selectlist"`
}

// NumberMetadata struct
type NumberMetadata struct {
	Decimals int `json:"decimals" uesio:"studio.decimals"`
}

// FileMetadata type
type FileMetadata struct {
	Accept         string `json:"accept" yaml:"accept,omitempty" uesio:"studio.accept"`
	FileCollection string `json:"filecollection" yaml:"filecollection,omitempty" uesio:"studio.filecollection"`
}

// ReferenceMetadata type
type ReferenceMetadata struct {
	Collection string `json:"collection" yaml:"collection,omitempty" uesio:"studio.collection"`
	OnDelete   string `json:"ondelete" yaml:"ondelete,omitempty" uesio:"studio.ondelete"`
}

// Field struct
type Field struct {
	ID                 string              `yaml:"-" uesio:"uesio.id"`
	Name               string              `yaml:"name" uesio:"studio.name"`
	CollectionRef      string              `yaml:"collection" uesio:"studio.collection"`
	Namespace          string              `yaml:"-" uesio:"-"`
	Type               string              `yaml:"type" uesio:"studio.type"`
	Label              string              `yaml:"label" uesio:"studio.label"`
	ReadOnly           bool                `yaml:"readOnly,omitempty" uesio:"studio.readonly"`
	CreateOnly         bool                `yaml:"createOnly,omitempty" uesio:"studio.createonly"`
	SelectList         string              `yaml:"selectList,omitempty" uesio:"studio.selectlist"`
	Workspace          *Workspace          `yaml:"-" uesio:"studio.workspace"`
	Required           bool                `yaml:"required,omitempty" uesio:"studio.required"`
	NumberMetadata     *NumberMetadata     `yaml:"number,omitempty" uesio:"studio.number"`
	FileMetadata       *FileMetadata       `yaml:"file,omitempty" uesio:"studio.file"`
	ReferenceMetadata  *ReferenceMetadata  `yaml:"reference,omitempty" uesio:"studio.reference"`
	ValidationMetadata *ValidationMetadata `yaml:"validate,omitempty" uesio:"studio.validate"`
	AutoPopulate       string              `yaml:"autopopulate,omitempty" uesio:"studio.autopopulate"`
	itemMeta           *ItemMeta           `yaml:"-" uesio:"-"`
	CreatedBy          *User               `yaml:"-" uesio:"uesio.createdby"`
	Owner              *User               `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy          *User               `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt          int64               `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt          int64               `yaml:"-" uesio:"uesio.createdat"`
	SubFields          []SubField          `yaml:"subfields,omitempty" uesio:"studio.subfields"`
	SubType            string              `yaml:"subtype,omitempty" uesio:"studio.subtype"`
	LanguageLabel      string              `yaml:"languageLabel,omitempty" uesio:"studio.languagelabel"`
	ColumnName         string              `yaml:"columnname,omitempty" uesio:"studio.columnname"`
}

// GetFieldTypes function
func GetFieldTypes() map[string]bool {
	return map[string]bool{
		"TEXT":        true,
		"NUMBER":      true,
		"LONGTEXT":    true,
		"CHECKBOX":    true,
		"MULTISELECT": true,
		"SELECT":      true,
		"REFERENCE":   true,
		"FILE":        true,
		"USER":        true,
		"LIST":        true,
		"DATE":        true,
		"MAP":         true,
		"TIMESTAMP":   true,
		"EMAIL":       true,
		"AUTONUMBER":  true,
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

func (f *Field) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s_%s", workspace, f.CollectionRef, f.Name)
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

func (f *Field) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, f.Name)
	if err != nil {
		return err
	}
	fieldType := getNodeValueAsString(node, "type")
	_, ok := GetFieldTypes()[fieldType]
	if !ok {
		return errors.New("Invalid Field Type for Field: " + f.GetKey() + " : " + fieldType)
	}
	if fieldType == "REFERENCE" {
		err := validateReferenceField(node, f.GetKey())
		if err != nil {
			return err
		}
	}
	if fieldType == "SELECT" {
		err := validateSelectListField(node, f.GetKey())
		if err != nil {
			return err
		}
	}
	if fieldType == "NUMBER" {
		err := validateNumberField(node, f.GetKey())
		if err != nil {
			return err
		}
	}

	if fieldType == "FILE" {
		err := validateFileField(node, f.GetKey())
		if err != nil {
			return err
		}
	}
	return node.Decode(f)
}

func validateFileField(node *yaml.Node, fieldKey string) error {
	fileNode, err := getMapNode(node, "file")
	if err != nil {
		return fmt.Errorf("Invalid File metadata provided for field: " + fieldKey + " : " + err.Error())
	}
	if fileNode.Kind != yaml.MappingNode {
		return fmt.Errorf("Invalid File metadata provided for field: " + fieldKey)
	}
	fileCollection := getNodeValueAsString(fileNode, "filecollection")
	if fileCollection == "" {
		return fmt.Errorf("Invalid File metadata provided for field: " + fieldKey + " : No file collection provided")
	}
	return nil
}

func validateNumberField(node *yaml.Node, fieldKey string) error {
	numberNode, err := getMapNode(node, "number")
	if err != nil {
		return fmt.Errorf("Invalid Number metadata provided for field: " + fieldKey + " : " + err.Error())
	}
	if numberNode.Kind != yaml.MappingNode {
		return fmt.Errorf("Invalid Number metadata provided for field: " + fieldKey)
	}
	decimals := getNodeValueAsString(numberNode, "decimals")
	if decimals == "" {
		return fmt.Errorf("Invalid Number metadata provided for field: " + fieldKey + " : No decimals value provided")
	}
	return nil
}

func validateSelectListField(node *yaml.Node, fieldKey string) error {
	selectListName := getNodeValueAsString(node, "selectList")
	if selectListName == "" {
		return fmt.Errorf("Invalid selectlist metadata provided for field: " + fieldKey + " : Missing select list name")
	}
	return nil
}

func validateReferenceField(node *yaml.Node, fieldKey string) error {
	referenceNode, err := getMapNode(node, "reference")
	if err != nil {
		return fmt.Errorf("Invalid Reference metadata provided for field: " + fieldKey + " : " + err.Error())
	}
	if referenceNode.Kind != yaml.MappingNode {
		return fmt.Errorf("Invalid Reference metadata provided for field: " + fieldKey)
	}
	referencedCollection := getNodeValueAsString(referenceNode, "collection")
	if referencedCollection == "" {
		return fmt.Errorf("Invalid Reference metadata provided for field: " + fieldKey + " : No collection provided")
	}
	return nil
}
